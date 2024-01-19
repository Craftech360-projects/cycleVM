const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const path = require("path");
const sqlite3 = require('sqlite3');
const app = express();
const server = http.Server(app);
const io = socketIO(server, { cors: { origin: "*" }, allowEIO3: true });

const portMap = new SerialPort({ path: "COM8", baudRate: 115200 });

const db = new sqlite3.Database('peddle-user.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the database');
  }
});

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, whoIsWinner TEXT)');
});
const espDelimiter = "\n";

const port = 6660;

app.use("/assets", express.static(path.join(__dirname, "assets")));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/home", (req, res) => {
  res.render("home.ejs");
});

app.get("/ipad", (req, res) => {
  res.render("ipad.ejs");
});

app.get("/tab", (req, res) => {
  res.render("tab.ejs");
});

app.get("/laptopscreen", (req, res) => {
  res.render("laptopscreen.ejs");
});

app.get("/greeting", (req, res) => {
  res.render("greeting.ejs", { timerSeconds });
});

server.listen(port, () => {
  console.log("Server is listening on port " + port);
});

let timerSeconds = 0;
var speedLimit = 0.5;
var timerInterval;

const parser = portMap.pipe(new ReadlineParser({ delimiter: "\r\n" }));
parser.on("data", (line) => {
  // console.log("data", line);

  const arr = line.split(":");
  const item = {
    bgOffset: Number(arr[0]) * speedLimit,
    // textOffset: Number(arr[1]) * speedLimit,
    // "numberOffset": Number(arr[2]) * speedLimit
  };
  processArrayinParallel(item);
  // console.log("data recived " ,item)
});
const readline = require("readline");
const { log } = require("console");
      let isSending = false;
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });




// Listen for the "requestSerialData" event from the client
io.on("connection", (socket) => {
  console.log("user Connected");

  socket.on("serialEnd", () => {
    console.log("resetting");
    portMap.write("f" + espDelimiter, (err) => {
      if (err) {
        console.error("Error writing to ESP:", err);
      } else {
        console.log('Sent letter "f" to ESP');
        setTimeout(() => {
        }, 2000);
      }
    });
  });

  rl.on("line", (input) => {
    // Check if the input is 'f'
    if (input.trim().toLowerCase() === "f") {
      // Send 'f' to ESP through socket
      socket.emit("command", { key: "f" });

      // Log that the "f" key was pressed
      console.log('Sent letter "f" to ESP');

    }

  });
  socket.on('saveNamesAndInitializeWinner', (name) => {
    db.run('INSERT INTO users (name) VALUES (?)', [name], function (err) {
      if (err) {
        console.error('Error inserting data:', err.message);
      } else {
        console.log(`Row inserted with ID: ${this.lastID}`);
        // Store this.lastID for later use to update the winner
        const insertedUserID = this.lastID;
        const data = {
          userName: name,
          id: insertedUserID
        }
        io.emit('userSaved', data);

        portMap.write("f" + espDelimiter, (err) => {
          if (err) {
            console.error("Error writing to ESP:", err);
          } else {
            console.log('Sent letter "s" to ESP');
            setTimeout(() => {
            }, 2000);
          }
        })
      }

    });
  });

  socket.on('winner', (e) => {
    db.all('SELECT * FROM users', [], (err, rows) => {
      if (err) {
        console.error('Error querying data:', err.message);
      } else {
        console.log('Query result:', rows.length);
        db.run('UPDATE users SET whoIsWinner = ? WHERE id = ?', [e, rows.length], (err) => {
          if (err) {
            console.error('Error updating data:', err.message);
          } else {
            console.log(`Updated whoIsWinner for user with ID ${2}`);
          }
        });
      }
    });
  })

  socket.on('command', (e)=>{
    portMap.write("f" + espDelimiter, (err) => {

      if (err) {
        console.error("Error writing to ESP:", err);
      } else {
        console.log('Sent letter "f" to ESP');
        setTimeout(() => {
        }, 2000);
      }
    })

  })

});

  



portMap.write("f" + espDelimiter, (err) => {

  if (err) {
    console.error("Error writing to ESP:", err);
  } else {
    console.log('Sent letter "f" to ESP');
    setTimeout(() => {
    }, 2000);
  }
})


var cycklePair = {};

function isInRange(number) {
  return number >= 3100;
}

async function processArrayinParallel(item) {
  cycklePair = item;
  const promises = Object.keys(item).map((key) => processItem(key, item[key]));
  await Promise.all(promises);
}

let reached1100Counter = 0;

async function processItem(key, value) {
  const serialData = value;
  if (serialData > 1 && serialData <= 150) {
    
    const percentage = (serialData / 100) * 10;

    console.log("percentage",percentage);
    switch (key) {
      case "bgOffset":
        io.emit("bgOffset", percentage);
        break;

      // case "textOffset":
      //   io.emit("textOffset", percentage);
      //   break;
      // case "numberOffset":
      //   io.emit("numberOffset", percentage);
      //   break;
      // default:
      //   console.log("empty");
      //   break;
    }
  }

}
