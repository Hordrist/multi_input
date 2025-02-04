// server.mjs
import { createServer } from 'node:http';
import {readFile} from 'node:fs';

/*const server = createServer((req, res) => {
res.writeHead(200, { 'Content-Type': 'text/plain' });
res.end('Hello World!\n');
});

// starts a simple http server locally on port 3000
server.listen(3000, '127.0.0.1', () => {
console.log('Listening on 127.0.0.1:3000');
});*/



readFile('./WebLab.html', function (err, html) {
    if (err) {
        throw err; 
    }       
    const server = createServer(function(request, response) {  
        response.writeHeader(200, {"Content-Type": "text/html"});
        response.write(html);  
        response.end();
    })
    server.listen(3000, '127.0.0.1', () => {
        console.log('Listening on 127.0.0.1:3000');
    })
});

// run with `node server.mjs`

