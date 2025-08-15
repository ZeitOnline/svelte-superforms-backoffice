# Local Development

Initially, we were using docker-compose so we could call certain API endpoints with data copied from production. However, since we missed the speed of Vite, we decided to use the `proxy` setup we often use in other projects and maintain our own local tables instead.

## Step 1 - Get a dump for your local tables

Here’s an example of how we did this for wortiger:

```pgsql
createdb wortiger
pg_dump -Oc service=wortiger-production > wortiger.sql
psql wortiger -f wortiger.sql
```

## Step 2 - Run the APIs that you need

You’ll need to add some proxy configuration in Vite:

```js
  server: {
    proxy: {
      '/api/eckchen': {
        target: 'http://localhost:3001',
        rewrite: (path) => path.replace(/^\/api\/eckchen/, ''),
      },
      '/api/wortiger': {
        target: 'http://localhost:3002',
        rewrite: (path) => path.replace(/^\/api\/wortiger/, ''),
      },
    },
  },
```

Finally, to start the APIs, run the following commands. Note that we’re assigning the same ports we set earlier in the proxy configuration:

```nginx
env PGRST_SERVER_PORT=3001 PGRST_DB_ANON_ROLE=moderator PGRST_DB_SCHEMA=public PGRST_DB_URI=postgres:///eckchen PGRST_LOG_LEVEL=info postgrest

env PGRST_SERVER_PORT=3002 PGRST_DB_ANON_ROLE=wortiger PGRST_DB_SCHEMA=public PGRST_DB_URI=postgres://wortiger@localhost/wortiger PGRST_LOG_LEVEL=info postgrest
```
