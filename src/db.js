import mongo from "mongodb"

let connection_string="mongodb+srv://admin:admin@nase-male-slastice.zss9l.mongodb.net/?retryWrites=true&w=majority&appName=nase-male-slastice"

let client = new mongo.MongoClient(connection_string,{
    useNewUrlParser: true,
    useUnifiedTopology: true
})

let db = null
export default ()=> {
    return new Promise((resolve, reject)=>{

        if(db && client.isConnected()){
            resolve(db)
        }

        client.connect(err=>{
            if(err){
                reject("doslo je do greske" + err)
            }
            else{
                console.log("Uspjesno spajanje na bazu")
                let db = client.db("naseMaleSlastice")
                resolve(db)
            }
        })
    })
}