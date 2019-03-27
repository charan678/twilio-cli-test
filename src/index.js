const sinon = require('sinon');
const OclifConfig = require('@oclif/config');
const { expect, test } = require('@oclif/test');
const tmp = require('tmp');

function getFakeSid(prefix) {
  return (
    prefix
      .trim()
      .toUpperCase()
      .substr(0, 2) + '1234567890abcdef1234567890abcdef'
  );
}

const constants = {
  FAKE_ACCOUNT_SID: getFakeSid('AC'),
  FAKE_API_KEY: getFakeSid('SK'),
  FAKE_API_SECRET: 'fake password'
};

async function createCommand(ctx, CommandClass, args) {
  ctx.testCmd = new CommandClass(args, ctx.fakeConfig, {
    async getCredentials(projectId) {
      return {
        apiKey: constants.FAKE_API_KEY,
        apiSecret: constants.FAKE_API_SECRET + projectId
      };
    },

    saveCredentials: sinon.fake.resolves(true)
  });
}

const twilioTest = test
  .register('twilioCliEnv', Config => {
    return {
      async run(ctx) {
        ctx.tempConfigDir = tmp.dirSync({ unsafeCleanup: true });
        ctx.fakeConfig = {
          configDir: ctx.tempConfigDir.name
        };

        if (!ctx.config) {
          ctx.config = await OclifConfig.load();
        }
        ctx.config.configDir = ctx.fakeConfig.configDir;

        if (ctx.userConfig) {
          const tempConfig = new Config(ctx.fakeConfig.configDir);
          await tempConfig.save(ctx.userConfig);
        }
      },
      finally(ctx) {
        ctx.tempConfigDir.removeCallback();
      }
    };
  })
  .register('twilioFakeProject', ConfigData => {
    return {
      run(ctx) {
        ctx.userConfig = new ConfigData();
        ctx.userConfig.addProject('default', constants.FAKE_ACCOUNT_SID);
      }
    };
  })
  .register('twilioCreateCommand', (CommandClass, args) => {
    return {
      async run(ctx) {
        await createCommand(ctx, CommandClass, args);
      }
    };
  })
  .register('twilioCommand', (CommandClass, args) => {
    return {
      async run(ctx) {
        await createCommand(ctx, CommandClass, args);
        await ctx.testCmd.run();
      }
    };
  });

module.exports = {
  expect,
  test: twilioTest,
  constants,
  getFakeSid
};