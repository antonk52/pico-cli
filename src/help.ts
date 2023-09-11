import type { CommandSpec, Options, ProgramSpec } from "./types";

const INDENT = "    ";
const nameify = (x: string | [string]): string =>
  Array.isArray(x) ? `<${x[0].toUpperCase()}>...` : `<${x.toUpperCase()}>`;
function linifyDesc(desc: string): string[] {
  if (desc.length < 80) return [desc];

  const preferredLineBreakIndex = desc.lastIndexOf(" ", 79);

  if (preferredLineBreakIndex > -1) {
    return [
      desc.slice(0, preferredLineBreakIndex),
      ...linifyDesc(desc.slice(preferredLineBreakIndex + 1)),
    ];
  } else {
    const backupLineBreakIndex = desc.indexOf(" ", 79);
    return backupLineBreakIndex > -1
      ? [
          desc.slice(0, backupLineBreakIndex),
          ...linifyDesc(desc.slice(backupLineBreakIndex + 1)),
        ]
      : [desc];
  }
}
const DESC_LINES_SEP = `\n${INDENT.repeat(5)}`;
function tableRow(col1: string, col2: string): string {
  const desc = linifyDesc(col2).join(DESC_LINES_SEP);
  return col1.length > 19
    ? `${col1}${DESC_LINES_SEP}${desc}`
    : `${col1}${" ".repeat(20 - col1.length)}${desc}`;
}
/**
 * Returns generated help string
 * @example
 * ```
 * my-cli
 * Used to do a thing or two
 *
 * USAGE:
 *     my-cli
 *
 * SUBCOMMANDS:
 *     cmd1            Works in one way
 *     cmd2            Works in another way
 *
 * OPTIONS:
 *     --option, -o <VALUE>
 *                     Can be used to pass option
 *     --message, -m   Supply message value
 * ```
 */
export function help(
  cliName: string,
  subcommands: [string] | [],
  rootSpec: ProgramSpec<any>,
  commands: Record<string, CommandSpec<any, any>>,
): string {
  const lines: string[] = [];
  const flagsSpec: Options = { ...rootSpec.options };

  const subCmdName = subcommands[0];
  const cmdSpec = subCmdName != null ? commands[subCmdName] : undefined;
  let isValidSubCommand = false;
  if (subCmdName && commands[subCmdName]) {
    isValidSubCommand = true;
    Object.assign(flagsSpec, commands[subCmdName].options);
  }

  const arg = cmdSpec?.reqArgName;
  lines.push(
    "",
    cliName,
    rootSpec.description,
    "",
    "USAGE:",
    `${INDENT}${cliName} ${subcommands.join(" ")} ${
      arg ? nameify(arg) : ""
    }`.trimEnd(),
  );

  const commandsEntries = Object.entries(commands);
  if (!isValidSubCommand && commandsEntries.length) {
    lines.push(
      "",
      "SUBCOMMANDS:",
      ...commandsEntries.map(([name, cmdSpec]) => {
        const arg = cmdSpec.reqArgName;
        const line = `${INDENT}${name}${arg ? ` ${nameify(arg)}` : ""}`;
        return tableRow(line, cmdSpec.description);
      }),
    );
  }

  const flagsEntries = Object.entries(flagsSpec);
  if (flagsEntries.length > 0) {
    lines.push(
      "",
      "OPTIONS:",
      ...flagsEntries.map(([name, fSpec]) => {
        const line = `${INDENT}${fSpec.names.join(", ")}${
          fSpec.handler === Boolean ? "" : ` ${nameify(name)}`
        }`;
        return tableRow(line, fSpec.description);
      }),
    );
  }

  lines.push("");

  return lines.join("\n");
}
