<div align="center">

<a target="_blank" href="https://github.com/ZeitOnline/svelte-superforms-backoffice">
  <img src="./static/eckchen-stylish.png" alt="Thumbnail" width="300" />
</a>

<div>

# Eckchen Admin Interface

<img style="margin-block: 20px;" src="./static/favicon-eckchen.png" alt="Logo Eckchen" width="50" />
</div>


[Repo](https://github.com/ZeitOnline/svelte-superforms-backoffice)
|
[Figma](https://www.figma.com/design/3Dz9yV5vMb9bORSvQQkw8Q/Backoffice---Designs?node-id=6-59&t=iYY5z1KsRiPfrMBo-0)

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

## Requirements

- Node.js
- nvm
- npm

## Setup

1. Clone the repo
2. Run `nvm use` to install the latest lts version
3. Run `npm i --force` to install the required packages. As soon as Svelte 5 will become stable, we will not need --force.
4. Run `npm run dev` to start the dev server

## Test

You can run some tests by using the following commands:

1. `npm run test:unit` to run all the unit tests.

## To Dos

Check the main task on [Jira](https://zeit-online.atlassian.net/browse/ZO-5839) for further information.

- [ ] Implement the Microsoft Authentication
- [ ] POST game and questions do not work yet.
- [ ] PATCH game and questions do not work as expected (they are creating instead of UPSERT) and you need to update the page to make it work.
- [ ] We have used superform in NewGameView.svelte in two forms. Do we need it also when updating game and deleting?
- [ ] DELETE game does not work as expected.
- [ ] Tests for the different views need to be written.