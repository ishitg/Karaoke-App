// HINTS:
// 1. Import express and axios

// 2. Create an express app and set the port number.

// 3. Use the public folder for static files.

// 4. When the user goes to the home page it should render the index.ejs file.

// 5. Use axios to get a random secret and pass it to index.ejs to display the
// secret and the username of the secret.

// 6. Listen on your predefined port and start the server.


import express from "express";
import axios from "axios";
import jsdom from "jsdom";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

const yourBearerToken = "QJmAGsBGBN6HU5Pbt6Np7WcEcRxhXMXTAkBDbIeV20tOn5uyUgo0jkW1Jmn8EOqs";

app.use(express.static("public"));

app.use(bodyParser.urlencoded({extended: true}));

// Scrape lyrics from a Genius.com song URL
async function scrapeSongLyrics(url) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const dom = new jsdom.JSDOM(html, { contentType: 'text/html' });
        const lyricsDivs = dom.window.document.querySelectorAll('.Lyrics__Container-sc-1ynbvzw-1');
        let allLyrics = '';
        lyricsDivs.forEach(div => {
            let lyricsPart = div.innerHTML;
            lyricsPart = lyricsPart.replace(/<br>/g, '\n');
            lyricsPart = lyricsPart.replace(/(\[.*?\])/g, '\n$1\n');
            lyricsPart = lyricsPart.replace(/([^\n])\n([^\n])/g, '$1\n\n$2');
            lyricsPart = lyricsPart.replace(/<.*?>/g, '');
            allLyrics += lyricsPart + '\n'; // Concatenate each part with a newline
        });
        // console.log(allLyrics);
        return allLyrics;
    } catch (error) {
        console.error('Error fetching lyrics:', error);
        return null;
    }
}





// Example usage
// const songUrl = 'https://genius.com/James-arthur-say-you-wont-let-go-lyrics';
// const songUrl = 'https://genius.com/'+ mypath;

app.get("/",(req,res)=>{
    res.render("index.ejs",{
        lyric:'',
        pic: '',
        canPlaySong: '',
    });
});

app.post("/submit",async (req,res)=>{
    const songTitle = req.body.title;
    try {
        const searchresponse = await axios.get(`https://api.genius.com/search?q=${songTitle}`,{
            headers:{
                Authorization: `Bearer ${yourBearerToken}`
            },
        });
        const hits = searchresponse.data.response.hits;

        // console.log(hits);
        if(hits.length > 0)
        {
            const path = 'https://genius.com' +  hits[0].result.path;
            let songid = hits[0].result.id;
            console.log(path);
            console.log(songid);
            const lyrics = await scrapeSongLyrics(path);
            const pic = hits[0].result.header_image_url;
          
            const songresp = await axios.get(`https://api.genius.com/songs/${songid}`,{
              headers:{
                  Authorization: `Bearer ${yourBearerToken}`
              },
          });
          console.log("hey");
          
          const hitter = songresp.data.response.song;
          let spotifyTrackId = '';
          let canPlaySong = 0;
          const pp = hitter.media;
          // console.log(hitter);
          // if(pp.length >= 2 && pp[1].provider === 'spotify')
          // {
          //   const songpath = hitter.media[1].url;
          //   console.log(songpath);
          //   spotifyTrackId = songpath.split('/').pop();
          //   console.log(canPlaySong);
          //   // console.log("hey");
          //   // console.log(spotifyTrackId);
          //   canPlaySong = 1;
          // }

          if (hitter.media && hitter.media.some(media => media.provider === 'spotify')) {
            const spotifyMedia = hitter.media.find(media => media.provider === 'spotify');
            const songpath = spotifyMedia.url;
            spotifyTrackId = songpath.split('/').pop();
            canPlaySong = 1;
        }
        else
        {
          // Function to get Spotify access token
async function getSpotifyAccessToken() {
  // Replace 'your_client_id' and 'your_client_secret' with your Spotify app credentials
  const response = await axios.post('https://accounts.spotify.com/api/token', 'grant_type=client_credentials', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from('035da09cd08b4ece908059f26cfd393c' + ':' + '10613cb874d5479da167729a61bee2d4').toString('base64')
    }
  });
  return response.data.access_token;
}

// Function to search for a song on Spotify
async function searchSongOnSpotify(songTitle, accessToken) {
  console.log(songTitle);
  
  const response = await axios.get(`https://api.spotify.com/v1/search?q=${songTitle}&type=track`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  // Extract the track ID from the first search result
  const tracks = response.data.tracks.items;
  if (tracks.length > 0) {
    return tracks[0].id; // Return the Spotify track ID
  } else {
    return null; // No results found
  }
}

// Example usage
const accessToken = await getSpotifyAccessToken();
spotifyTrackId = await searchSongOnSpotify(songTitle, accessToken);

canPlaySong = 1;
console.log(spotifyTrackId);
        }

            res.render("index.ejs",{
                lyric: lyrics,
                pic: pic,
                spotify_track_id: spotifyTrackId,
                can_play_song: canPlaySong,
            });
        }
        else
        {
            res.render("index.ejs",{
                lyric: 'No lyrics found for this song.'
            });
        }

        

        
    } catch (error) {
        console.error(error);
        res.render("index.ejs",{
            lyric: "An error occured"
        });
    }
})

// I would like to use spotify api to play songs on the site


app.listen(port, ()=>{
    console.log(`Server running on port ${port}`);
})
