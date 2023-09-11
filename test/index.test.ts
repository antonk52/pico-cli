import { describe, expect, test } from "vitest";
import { PicoCli } from "../src/index";

describe("lilo-cli", () => {
  let fooCalled = false;
  let calledParams: object = {};

  const cliWithGlobalAndCmdOptions = PicoCli.create({
    name: "test",
    description: "description",
    options: {
      g1: {
        handler: String,
        names: ["--global-string"],
        description: "foo",
      },
      g2: {
        handler: Boolean,
        names: ["--global-bool"],
        description: "global bool option",
      },
    },
  }).addCommand("foo", {
    description: "foo command",
    aliases: ["f"],
    handler: (params) => {
      calledParams = params;
      const typed_params: {
        g1: string | undefined;
        f_string: string | undefined;
        f_string_required: string;
        f_number: number | undefined;
        _: string[];
      } = params;

      void typed_params;

      fooCalled = true;
    },
    options: {
      f_string: {
        handler: String,
        names: ["--f-string"],
        description: "f string option",
      },
      f_string_required: {
        handler: String,
        names: ["--f-string-required"],
        description: "f string required option",
        required: true,
      },
      f_number: {
        handler: Number,
        names: ["--f-number"],
        description: "f number option",
      },
    },
  });

  // @ts-expect-error
  cliWithGlobalAndCmdOptions.out = () => {};

  test("Throws for unknown subcommand", () => {
    expect(() => cliWithGlobalAndCmdOptions.run(["zoo"])).toThrowError(
      "Expected one of known commands: foo",
    );
    expect(calledParams).toEqual({});
  });

  test("Throws when required flags are not provided", () => {
    expect(() => cliWithGlobalAndCmdOptions.run(["foo"])).toThrowError(
      "Required options are not provided",
    );
    expect(calledParams).toEqual({});
  });

  test("Throws when an option doesn't get a value", () => {
    expect(() =>
      cliWithGlobalAndCmdOptions.run(["foo", "--f-string-required"]),
    ).toThrowError(
      'Option "--f-string-required" expects a value, but got none',
    );

    fooCalled = false;
  });

  test("Throws when a boolean option is provided a value", () => {
    expect(() =>
      cliWithGlobalAndCmdOptions.run([
        "foo",
        "--f-string-required=bar",
        "--global-bool=bar",
      ]),
    ).toThrowError("Provided a value for a boolean option --global-bool");

    fooCalled = false;
  });

  test("Throws when a command contains non allowed chars", () => {
    expect(() =>
      PicoCli.create({
        name: "foo",
        description: "",
        options: {},
      }).addCommand("foo bar", {
        description: "abc",
        handler: () => {},
      }),
    ).toThrowError(
      'Command names can only contain letters, digits, underscores, and hyphens. Got "foo bar"',
    );
  });

  test("Calls provided function for a command", () => {
    cliWithGlobalAndCmdOptions.run([
      "foo",
      "--f-string-required",
      "param-value",
      "--global-bool",
    ]);

    expect(fooCalled).toBe(true);
    expect(calledParams).toEqual({
      _: [],
      f_string_required: "param-value",
      g2: true,
    });

    fooCalled = false;
  });

  test("Calls provided function for a command alias", () => {
    cliWithGlobalAndCmdOptions.run([
      "f",
      "--f-string-required",
      "param-value",
      "--global-bool",
    ]);

    expect(fooCalled).toBe(true);
    expect(calledParams).toEqual({
      _: [],
      f_string_required: "param-value",
      g2: true,
    });

    fooCalled = false;
  });

  test("parses arguments as expected", () => {
    let cliParams = {};

    expect(() =>
      PicoCli.create({
        name: "test",
        description: "test description",
        options: {},
      })
        .addCommand("foo", {
          description: "foo command",
          handler: (params) => {
            const cliParamsInner: {
              f_string: string | undefined;
              f_string_required: string;
              f_number: number | undefined;
              _: string[];
            } = params;

            cliParams = cliParamsInner;

            fooCalled = true;
          },
          options: {
            f_string: {
              handler: String,
              names: ["--f-string"],
              description: "description",
            },
            f_string_skipped: {
              handler: PicoCli.commaSeparatedString,
              names: ["--f-string-skipped"],
              description: "description",
            },
            f_string_array: {
              handler: PicoCli.commaSeparatedString,
              names: ["--f-string-array"],
              description: "description",
            },
            f_string_array_eq: {
              handler: PicoCli.commaSeparatedString,
              names: ["--f-string-array-eq"],
              description: "description",
            },
            f_string_required: {
              handler: String,
              names: ["--f-string-required"],
              description: "description",
              required: true,
            },
            f_number: {
              handler: Number,
              names: ["--f-number"],
              description: "description",
            },
          },
        })
        .run([
          "foo",
          "--f-string",
          "foo",
          "--f-string-array",
          "1",
          "--f-string-array",
          "2",
          "--f-string-array-eq=1,2",
          "--f-string-required",
          "required",
          "--f-number",
          "42",
          "other",
          "params",
        ]),
    ).not.toThrowError();

    expect(fooCalled).toBe(true);
    expect(cliParams).toEqual({
      _: ["other", "params"],
      f_string: "foo",
      f_string_required: "required",
      f_string_array: ["1", "2"],
      f_string_array_eq: ["1", "2"],
      f_number: 42,
    });
  });
});
