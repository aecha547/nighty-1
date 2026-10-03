/** Negative browser fixture: missing media returns SPA HTML with HTTP 200. */
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../dist/index.html',import.meta.url));
createServer((_request,response)=>{response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});response.end(html);}).listen(4384,'127.0.0.1',()=>console.log('Missing-media fixture: http://127.0.0.1:4384'));
