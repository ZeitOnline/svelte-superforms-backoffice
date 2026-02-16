<div align="center">

# Game Admin Interface

[Repo](https://github.com/ZeitOnline/svelte-superforms-backoffice)

</div>

## Features

- 🛠️ Modern Admin Interface created with Svelte5 and SvelteKit
- 🏡 Create new games (also through csv upload), edit the existing ones, delete them! You have full control!
- 📝 [Superforms](https://superforms.rocks/) is used to handle validation with the forms
- 🎨 Styling created using TailwindCSS and [Zeit Design System](https://npmjs.com/package/@zeitonline/design-system)
- ⌨️ 100% written in TypeScript
- 💻 Reach local the server easily with postqREST
- 🧪 Test using vitest and svelte testing library
- 🎁 ...much more

## Description of the project

Following the modus operandi of other games, it was decided that eckchen needed a new admin interface where people could easily update information regarding the games. The project is managed by the team Engagement and Games.

## What needs to be changed for a new game?

Since we started with `eckchen`, you will see many pieces of code that have to do with that game, like the `schemas` for zod or the elements in the ui, like the ones you will find in `GameTableWrapper.svelte`.

Here you will see a list of the files that you will surely need to edit:

```md
src
├── lib
│   ├── error-messages.ts // the error messages for the form validation
│   ├── queries.ts // all the queries that will be used with the postqres
├── components
│   ├── GameTableWrapper.svelte // the main component used for Create and Edit
│   ├── Header.svelte // you will need to replace the EckchenLogo.svelte
│   ├── ... // other components probably will need some change
├── config
│   ├── games.config.ts // define all the schemas for the forms (validation, types, etc.)
└── app.html // change the name of the game
```

## Requirements

- Node.js
- nvm
- npm

## Setup

1. Clone the repo
2. Run `nvm use` to install the latest lts version
3. Run `npm i` to install the required packages. As soon as Svelte 5 will become stable, we will not need --force.
4. Run `npm run dev` to start the dev server

## Test

You can run some tests by using the following commands:

1. `npm run test:unit` to run all the unit tests.
