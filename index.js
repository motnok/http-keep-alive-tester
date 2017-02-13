const http = require('http');
const url = require('url');

const commandLineArgs = require('command-line-args')
const agentkeepalive = require('agentkeepalive');
const agent = new agentkeepalive();
const hrstart = process.hrtime();

let count = 0;

const options = commandLineArgs([
  { name: 'url', alias: 'u', type: String },
  { name: 'total', alias: 't', type: Number, defaultValue: 50 },
  { name: 'keepalive', alias: 'k', type: Boolean, defaultValue: false }
]);

if(!options.url)
{
    return console.error('No URL provided');
}

const requestUrl = url.parse(options.url);

const doRequest = (logHeaders) => {
    return new Promise((resolve, reject) => {

        const requestOptions = {
            host: requestUrl.host,
            path: requestUrl.path,
            headers: {
                accept: 'application/json'
            },
            agent: options.keepalive ? agent : false
        }

        if(logHeaders) {
            console.log("Reqeust headers:");
            console.log(requestOptions);
            console.log();
        }

        var req = http.request(requestOptions, (res) => {

          if(logHeaders)
          {
              console.log(`Response status: ${res.statusCode}`);
              console.log(`Response headers:`);
              console.log(res.headers);
              console.log();
          }

          res.setEncoding('utf8');
          res.on('data', (chunk) => {});
          res.on('end', () => {
            resolve();
          });

        })

        req.end();
    })
}

doRequest(true) //Dry run
    .then(() => {
        const progress = require('progressbar').create().step(`${options.total} requests`)
        progress.setTotal(options.total);

        const runProfile = () => {

            doRequest().then(() => {
                progress.tick();
                if(count++ < options.total)
                {
                    runProfile();
                }
                else
                {
                    hrend = process.hrtime(hrstart);
                    console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1]/1000000);
                }
            })

        }

        runProfile();
    })
