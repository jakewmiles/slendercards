# slendercards

## Table of contents
- [Introduction](#Introduction)
- [Getting Started](#Getting-Started)
- [Features](#Features)
- [Future Features](#Future-Features)
- [Technologies](#Technologies)

## Introduction
slendercards is a web app built to help people learn foreign languages. Users can choose from multiple language pairs and automatically generate context-based flashcards based on personal search terms.

slendercards was built using Svelte on the front-end and expressJS and Mongoose on the back-end. Slendercards makes use of web scraping through an unofficial Reverso API (built on Cheerio and Axios) to create and store the digital flashcards.

See slendercards in action [here](https://www.youtube.com/watch?v=B_asB_UGEgM)

<code>
<img width="250" alt="slendercards home" src="https://user-images.githubusercontent.com/52141045/125161290-6400d280-e179-11eb-9d1e-a057acdaed82.png">
<img width="250" alt="slendercards create" src="https://user-images.githubusercontent.com/52141045/125161303-7418b200-e179-11eb-81ed-21248b29c245.png">
<img width="250" alt="Screenshot 2021-07-10 at 12 13 43" src="https://user-images.githubusercontent.com/52141045/125161315-84c92800-e179-11eb-9732-22c39b84f65f.png">
</code>

## Getting Started

1. Clone this repo and enter!

   ```bash
   git clone https://github.com/jakewmiles/slendercards.git
   cd slendercards
   ```

2. Run ````npm install```` to install all the required dependencies into your local repo. 

3. Navigate to the back-end and get the server up and running!

   ```bash
   cd server
   node index.js
   ```

4. In a new terminal, navigate back to the root folder and start running the front end.
    ```bash
    cd ..
    npm run dev
    ```

5. In the terminal you should see a message similar to:

   ```bash
   Your application is ready~! 🚀
   Local: http://localhost:5000
   ```
   
9. Navigate to the local address in your browser. The app should be running! 🎉

## Features

- Create new cards across a number of different language pairs
- Review the cards that you've created
- Customisable review sessions based on length and familiarity.

## Future Features

- Enable user authentication
- Deploy the app as a Chrome Extension

## Technologies

- Javascript
- Svelte
- Node.js
- Axios
- Cheerio
- express.js
- MongoDB
- Mongoose
