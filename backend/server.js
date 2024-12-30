
const express = require('express');
const app = express();
const port = 3000;

// frontend folder
app.use(express.static('../frontend'));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


// will remove nodemon from dep