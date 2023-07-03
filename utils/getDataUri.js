import DataUriParser from "datauri/parser.js";
import path from "path";

let getDataUri = (file) => {
  let dataUri = new DataUriParser();
  return dataUri.format(
    path.extname(file.originalname).toString(),
    file.buffer
  );
};

export default getDataUri;
