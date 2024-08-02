const axios = require('axios');

const tenant = "flomattresses";
const client_id = "my-trusted-client";
const username = "data.analyst@flomattress.com";
const password = "Tanmay0710";

let accessToken = "";
let refreshToken = "";
let tokenExpiryTime = 0; // Unix timestamp for when the access token expires

// Function to fetch access token and refresh token
const getAccessToken = async () => {
    const url = `https://${tenant}.unicommerce.com/oauth/token?grant_type=password&client_id=${client_id}&username=${username}&password=${password}`;

    try {
        const response = await axios.get(url, {
            headers: { "Content-Type": "application/json" }
        });
        accessToken = response.data.access_token;
        refreshToken = response.data.refresh_token;
        tokenExpiryTime = Date.now() + (6 * 60 * 60 * 1000); // Current time + 6 hours
        console.log("Access Token:", accessToken);
        console.log("Refresh Token:", refreshToken);
    } catch (error) {
        console.error("Error fetching access token:", error.response ? error.response.data : error.message);
    }
};

// Function to refresh access token
const refreshAccessToken = async () => {
    const url = `https://${tenant}.unicommerce.com/oauth/token`;
    const params = {
        grant_type: "refresh_token",
        client_id: client_id,
        refresh_token: refreshToken
    };

    try {
        const response = await axios.get(url, { params });
        accessToken = response.data.access_token;
        refreshToken = response.data.refresh_token;
        tokenExpiryTime = Date.now() + (6 * 60 * 60 * 1000); // Current time + 6 hours
        console.log("Refreshed Access Token:", accessToken);
        console.log("Refreshed Refresh Token:", refreshToken);
    } catch (error) {
        console.error("Error refreshing access token:", error.response ? error.response.data : error.message);
    }
};

// Function to check if the access token needs to be refreshed
const checkAndRefreshToken = async () => {
    if (Date.now() > tokenExpiryTime) {
        console.log("Access token expired, refreshing...");
        await refreshAccessToken();
    }
};

// Initial token fetch
getAccessToken();

// Export functions and tokens
module.exports = {
    getAccessToken,
    refreshAccessToken,
    checkAndRefreshToken,
    getAccessTokenValue: () => accessToken,
    getRefreshTokenValue: () => refreshToken
};
