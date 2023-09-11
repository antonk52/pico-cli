import { help } from "./help";
import type {
  CommandSpec,
  OptionHandler,
  Options,
  OptionsToParams,
  ProgramSpec,
} from "./types";

function parseArguments<F extends Options>(
  rawArgs: string[],
  optsSpec: F
): OptionsToParams<F> {
  const optsUtils = {
    toParamName: {} as Record<string, keyof F>,
    knownOpts: [] as string[],
    requiredOpts: [] as string[],
  };
  for (const optName in optsSpec) {
    optsSpec[optName].names.forEach((cliName) => {
      optsUtils.knownOpts.push(cliName);
      optsUtils.toParamName[cliName] = optName;
    });
    if (optsSpec[optName].required) {
      optsUtils.requiredOpts.push(optName);
    }
  }

  const result = { _: [] as string[] } as OptionsToParams<F>;

  for (let i = 0; i < rawArgs.length; i++) {
    const rawValue = rawArgs[i];
    let found = false;

    for (const knownFlag of optsUtils.knownOpts) {
      if (knownFlag === rawValue) {
        const paramName = optsUtils.toParamName[rawValue];
        const optionSpec = optsSpec[paramName];
        if (optionSpec.handler === Boolean) {
          // @ts-expect-error Type 'boolean' is not assignable to type 'FlagsToParams<F>[keyof F]'
          result[paramName] = true;
          found = true;
          break;
        } else {
          if (i === rawArgs.length - 1) {
            throw new PicoCli.Error(
              `Option "${rawValue}" expects a value, but got none`
            );
          }
          result[paramName] = optionSpec.handler(
            rawArgs[i + 1],
            result[paramName]
          );
          i++;
          found = true;
          break;
        }
      } else if (rawValue.startsWith(`${knownFlag}=`)) {
        const paramName = optsUtils.toParamName[knownFlag];
        const optionSpec = optsSpec[paramName];
        if (optionSpec.handler == Boolean) {
          throw new PicoCli.Error(
            `Provided a value for a boolean option ${knownFlag}`
          );
        }
        result[paramName] = optionSpec.handler(
          rawValue.slice(knownFlag.length + 1),
          result[paramName]
        );
        found = true;
        break;
      }
    }
    if (!found) result._.push(rawValue);
  }

  const nonProvidedRequiredFlags = optsUtils.requiredOpts
    .filter((x) => !(x in result))
    .map((x) => optsSpec[x].names[0])
    .join(", ");
  if (nonProvidedRequiredFlags) {
    throw new PicoCli.Error(
      `Required options are not provided: ${nonProvidedRequiredFlags}`
    );
  }
  return result;
}
function resolveCommandName<T extends string>(
  commands: Record<T, CommandSpec<any, any>>,
  wantedCmd: string
): T | null {
  if (wantedCmd in commands) return wantedCmd as T;

  for (const cmd in commands) {
    if (commands[cmd].aliases?.includes(wantedCmd)) return cmd;
  }

  return null;
}
const hasHelp = (xs: string[]) => xs.some((x) => x === "--help" || x === "-h");

export class PicoCli<GlobOpts extends Options> {
  commands: Record<string, CommandSpec<any, GlobOpts>> = {};
  /** Test only */
  private out = console.log;

  constructor(public spec: ProgramSpec<GlobOpts>) {}

  addCommand<CmdOpts extends Options | void>(
    name: string,
    spec: CommandSpec<CmdOpts, GlobOpts>
  ): PicoCli<GlobOpts> {
    if (!/^[\w\d_-]*$/i.test(name)) {
      throw new PicoCli.Error(
        `Command names can only contain letters, digits, underscores, and hyphens. Got "${name}"`
      );
    }
    this.commands[name] = spec;
    return this;
  }

  run(args: string[] = process.argv.slice(2)): void | Promise<void> {
    const [cmd, ...rest] = args;
    const wantedCommand = resolveCommandName(this.commands, cmd);
    if (wantedCommand === null) {
      if (hasHelp(args)) {
        return this.out(help(this.spec.name, [], this.spec, this.commands));
      }
      this.out(help(this.spec.name, [], this.spec, this.commands));
      const msg = `Expected one of known commands: ${Object.keys(
        this.commands
      ).join(", ")}`;
      throw new PicoCli.Error(msg);
    }
    if (hasHelp(rest)) {
      return this.out(help(this.spec.name, [cmd], this.spec, this.commands));
    }

    const command = this.commands[wantedCommand];
    const params = parseArguments(rest, {
      ...("options" in this.spec && this.spec.options),
      ...command.options,
    });

    return command.handler(params as Parameters<typeof command.handler>[0]);
  }

  static create = <T extends Options>(spec: ProgramSpec<T>) =>
    new PicoCli<T>(spec);

  static flagHandler = <T>(handler: OptionHandler<T>): OptionHandler<T> =>
    handler;

  static commaSeparatedString = PicoCli.flagHandler<string[]>(
    (val, prev = []) => {
      prev.push(...val.split(","));

      return prev;
    }
  );

  static Error = class PicoCliError extends Error {};
}
