const request = require("request")

const geocode = (address) => {
    return new Promise((resolve, reject)=>{
        const url = "https://api.mapbox.com/geocoding/v5/mapbox.places/"+encodeURIComponent(address)+".json?access_token="+process.env.GEOCODE_TOKEN+"&limit=1"

        request({url, json: true}, (error, response, {features}) => {
            if (error) {
                return reject("Unable to connect to geocoding service!") 
    
            } else if (features.length === 0) {
                return reject("Unable to find location!")
    
            }
            resolve({
                longitude: features[0].center[0], 
                latitude: features[0].center[1]
                })
        })
    })

}


module.exports = geocode