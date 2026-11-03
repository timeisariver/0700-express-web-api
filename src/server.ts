import "dotenv/config";
import { app } from "./app";
import { assertJwtSecrets } from "./lib/jwt";

assertJwtSecrets();

const port = Number(process.env["PORT"] ?? 3000);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
