export const getAllGames = async () => {
    // const response = await fetch('/api/games');
    // return response.json();
    return [
        {
                id: "1",
                name: "Paco",
                players: 4,
                publishedAt: "2024-07-13",
                isActive: false
            },
            {
                id: "2",
                name: "Nico",
                players: 3,
                publishedAt: "2024-07-12",
                isActive: true
            },
            {
                id: "1231231839183",
                name: "game 34wwe",
                players: 3,
                publishedAt: "2024-07-11",
                isActive: true

            },
      ]
    }