# ChatGPT to Stickies

This is a Figma plugin that allows you to paste notes from ChatGPT into Stickies on a Figma page.

## How it Works

The UI (src/ui.tsx) allows pasting ChatGPT notes into a textarea and setting a maximum column count. When the "Paste as Notes" button is clicked, the notes and maxCol are sent to the plugin code (src/code.ts).

The plugin code performs the following steps:

1. Loads the Inter font
2. Parses the notes into {title, content} entries
3. Creates a sticky node for each entry
4. Sets the title and content font styles
5. Positions the stickies in a grid layout based on the maxCol
6. Appends the stickies to the current Figma page

Typescript is used for type safety and compilation is configured in tsconfig.json. The UI is a React app bootstrapped in src/ui.html. The plugin manifest is defined in manifest.json. package.json and package-lock.json manage the dependencies.

## Usage

1. Install the plugin from the Figma plugin browser
2. Open the plugin from the Plugins menu
3. Paste your ChatGPT notes into the textarea
4. Set the maximum columns
5. Click "Paste as Notes from ChatGPT"

The notes will be parsed and pasted as stickies on the current Figma page.

## Technologies Used

- Typescript
- React
- Webpack
- Jest (for testing)

## Installation and Setup

Here are the steps to install and run this codebase:

1. Clone the repository:

```bash
git clone https://github.com/your-repo/chatgpt-to-stickies.git
```

2. Install the dependencies:

```bash
npm install
```

This will install all the packages listed in package.json.

3. Compile the TypeScript:

```bash
npm run build
```

This will compile the .ts and .tsx files to JavaScript and place them in the dist folder.

4. Run the development server:

```bash
npm run dev
```

This will start a Webpack dev server on port 8080.

5. Open the UI in your browser:

```
http://localhost:8080/ui.html
```

This will load the UI where you can paste ChatGPT notes and set the max columns.

When you click "Paste as Notes from ChatGPT", the notes will be parsed and stickies will be created in the browser console.

## Build for Production

To build for production:

```bash
npm run build
```

This will compile the code and optimize the bundles for production. The output will be in the dist folder.

The dist folder contains everything needed to publish the plugin to Figma. You can zip the dist folder and upload it as a Figma plugin.

## Testing

This codebase also includes unit tests, which are written using Jest. The Jest configuration can be found in package.json and tests are located in the tests folder.

The `parseNotes` function is tested to ensure it correctly parses a string of notes into an array of `{title, content}` entries. Note that the Figma-specific code is separated from the general-purpose code to allow for easier unit testing.

Here is how to run the tests:

```bash
npm run test
```

This will start Jest and run all test suites.

Please note that due to the nature of this project, most of the code interacts directly with the Figma API and as such, is difficult to unit test. Always manually verify that the plugin works as expected in Figma.

## Code Structure

The React frontend is in src/ui.tsx and the Node.js backend in src/code.ts. The frontend collects data from the user and passes it to the backend to generate sticky notes. The parseNotes function used to parse the notes is located in utils.ts, which is a separate file created to make unit testing easier.

The frontend and backend are bundled separately by Webpack as configured in webpack.config.js. The frontend is mounted to a div in src/ui.html. The plugin's manifest for Figma is defined in manifest.json.

For type safety, TypeScript is used, configured in tsconfig.json. To style the UI, src/ui.css is imported into the React app. All project dependencies and build scripts are located in package.json and locked down in package-lock.json.

This project is set up to be as modular as possible to promote separation of concerns and easier testing.
