const  mongoose = require('mongoose');

const connectionURL = process.env.MONGODB_URL// connection + db name ( task-manager-api is db)
mongoose.connect(connectionURL,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useUnifiedTopology: true 

})//connection to connect






