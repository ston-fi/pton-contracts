import 'dotenv/config';
import { compileX } from "../libs"
import { preprocBuildContractsLocal } from "./helpers";

(async () => {
    let autocleanup = undefined;
    if (process.env.DEBUG != undefined) {
        autocleanup = false;
    }

    preprocBuildContractsLocal({
        autocleanup: autocleanup,
    });

    console.log("Compiling Minter...");
    await compileX('Minter', {
        cells: true,
        base64: true,
    });

    console.log("Compiling Wallet...");
    await compileX('Wallet', {
        cells: true,
        base64: true,
    });

    console.log("Compiling Dummy...");
    await compileX('Dummy', {
        cells: true,
        base64: true,
    });

})();