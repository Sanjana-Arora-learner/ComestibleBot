const config=require('./config');
const dev =process.env.Node_ENV !== "PRODUCTION";
const path = require( "path" );

module.exports = {
    mode: dev ? "development" : "production",
    entry: "./Public/Index.js",
    resolve: {
        extensions: ["*", ".js", ".jsx"],
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /(node_modules|bower_components)/,
                loader: "babel-loader",
                options: { presets: ["@babel/env"] }
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
              }
        ]        
    },
    output: {
        path: path.resolve(__dirname, "Public/"),
        publicPath: '/Public/',
        filename: "bundle.js"
    }    
};