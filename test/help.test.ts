import { describe, expect, test } from "vitest";
import { LiloCli } from "../src/index";
import { help } from "../src/help";

const noop = () => {};

describe("help function", () => {
  const foo = LiloCli.create({
    name: "foo",
    description: "test cli description",
    options: {
      globalFlag: {
        names: ["--global-opt"],
        handler: Boolean,
        description: "available for all subcommands",
      },
    },
  })
    .addCommand("bar", {
      handler: noop,
      description: "bar subcommand",
      options: {
        barOnly: {
          names: ["--bar-only"],
          handler: Boolean,
          description: "only foo bar cmd",
        },
      },
    })
    .addCommand("zoo", {
      handler: noop,
      description: "zoo subcommand",
      options: {
        optionOne: {
          handler: Boolean,
          description:
            "A really really really really really really really really really really really really really really really really really really really really really really really really really log description.",
          names: ["--option-one"],
        },
        optionTwo: {
          handler: Boolean,
          description:
            "A somewhat resonably long description with extra words here and there",
          names: ["--option-two-with-really-long-name"],
        },
        optionThree: {
          handler: Boolean,
          description:
            "Option_with_uncomfortably_long_and_unbreakable_description_that_should_have_benn_on_multiple_lines",
          names: ["--option-three"],
        },
        optionFour: {
          handler: Boolean,
          description:
            "Option_with_uncomfortably_long_and_unbreakable_description_that_should_have_benn_on_multiple_lines that also has a few spaces so only one line will stick out from the descriopton, you should not write your documentation like this.",
          names: ["--option-four"],
        },
      },
    });
  // @ts-expect-error
  foo.out = noop;

  test("root command lists subcommnds", () => {
    const result = help("foo-cli", [], foo.spec, foo.commands);

    expect(result).toMatchInlineSnapshot(
      `
          "
          foo-cli
          test cli description

          USAGE:
              foo-cli

          SUBCOMMANDS:
              bar             bar subcommand
              zoo             zoo subcommand

          OPTIONS:
              --global-opt    available for all subcommands
          "
        `
    );
  });

  test("for a subcommand", () => {
    const result = help("foo-cli", ["bar"], foo.spec, foo.commands);

    expect(result).toMatchInlineSnapshot(
      `
          "
          foo-cli
          test cli description

          USAGE:
              foo-cli bar

          OPTIONS:
              --global-opt    available for all subcommands
              --bar-only      only foo bar cmd
          "
        `
    );
  });

  test("options description can be broken into multiple lines", () => {
    const result = help("foo-cli", ["zoo"], foo.spec, foo.commands);

    expect(result).toMatchInlineSnapshot(
      `
          "
          foo-cli
          test cli description

          USAGE:
              foo-cli zoo

          OPTIONS:
              --global-opt    available for all subcommands
              --option-one    A really really really really really really really really really really really
                              really really really really really really really really really really really
                              really really really log description.
              --option-two-with-really-long-name
                              A somewhat resonably long description with extra words here and there
              --option-three  Option_with_uncomfortably_long_and_unbreakable_description_that_should_have_benn_on_multiple_lines
              --option-four   Option_with_uncomfortably_long_and_unbreakable_description_that_should_have_benn_on_multiple_lines
                              that also has a few spaces so only one line will stick out from the
                              descriopton, you should not write your documentation like this.
          "
        `
    );
  });

  test("required only argument help", () => {
    const cli = LiloCli.create({
      name: "foo",
      description: "A command that expects one argument",
      options: {},
    }).addCommand("bar", {
      description: "the only command",
      reqArgName: "item",
      handler: noop,
    });
    const commandHelp = help("foo", ["bar"], cli.spec, cli.commands);
    const rootHelp = help("foo", [], cli.spec, cli.commands);

    expect(rootHelp).toMatchInlineSnapshot(`
          "
          foo
          A command that expects one argument

          USAGE:
              foo

          SUBCOMMANDS:
              bar <ITEM>      the only command
          "
        `);
    expect(commandHelp).toMatchInlineSnapshot(`
          "
          foo
          A command that expects one argument

          USAGE:
              foo bar <ITEM>
          "
        `);
  });

  test("required multiple argument help", () => {
    const cli = LiloCli.create({
      name: "foo",
      description: "A command that expects arguments",
      options: {},
    }).addCommand("bar", {
      description: "the only command",
      reqArgName: ["item"],
      handler: noop,
    });
    const commandHelp = help("foo", ["bar"], cli.spec, cli.commands);
    const rootHelp = help("foo", [], cli.spec, cli.commands);

    expect(rootHelp).toMatchInlineSnapshot(`
          "
          foo
          A command that expects arguments

          USAGE:
              foo

          SUBCOMMANDS:
              bar <ITEM>...   the only command
          "
        `);

    expect(commandHelp).toMatchInlineSnapshot(`
          "
          foo
          A command that expects arguments

          USAGE:
              foo bar <ITEM>...
          "
        `);
  });
});
