import axios from "axios";

async function test() {
  const { data } = await axios.post(
    "https://instagram120.p.rapidapi.com/api/instagram/posts",
    {
      username: "instagram",
      maxId: ""
    },
    {
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "instagram120.p.rapidapi.com",
        "Content-Type": "application/json"
      }
    }
  );

  console.log(process.env.RAPIDAPI_KEY);

}

test();