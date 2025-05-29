export interface AppEnv {
  Bindings: {
    JSANDY_RPC_URL: string;
    JSANDY_RPC_WS_URL: string;
    DATABASE_URL: string;
    REDIS_URL: string;
    DISCORD_BOT_TOKEN: string;
  };
}
