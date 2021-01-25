window.p = window.p || {};

/**
 * Global configuration.
 */
if (window.ethereum) {
    window.ethereum.autoRefreshOnNetworkChange = false;
}

/**
 * Application namespace.
 */
window.p.NAMESPACE = 'com.nfpawn';

/**
 * A list of known application errors.
 */
window.p.ERROR = {
    '00000001': 'File type not supported.',
    '00000002': 'Unable to read the file.',
    '00000003': 'Unable to parse CSV file.',
};

/**
 * Reads file's content into a string.
 * @param {Element} file DOM element reference (e.g. `e.target.files[0]`).
 */
window.p.readFileToString = async function (file) {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = (e) => {
                resolve(e.target.result);
            };
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Parses a CSV string to an array of items. 
 * @param {String} str CSV file content.
 */
window.p.parseStringToCsv = function (str) {
    return str.trim()
        .split(/\r?\n/)
        .slice(1)
        .map((line) => {
            return line.split(/;/)
                .map((i) => i.trim());
        });
}

/**
 * Converts an array of data to asset object.
 * @param {Array} arr Array of asset data.
 */
window.p.parseArrayToAsset = function (arr) {
    return {
        offeror: Web3.utils.toChecksumAddress(arr[0]),
        nftContract: Web3.utils.toChecksumAddress(arr[1]),
        nftId: ethers.BigNumber.from(arr[2]),
        saleExpiration: p.parseToInt(arr[3]),
        saleContract: Web3.utils.toChecksumAddress(arr[4]),
        saleAmount: ethers.BigNumber.from(arr[5]),
        termUntilCollateralAtRisk: p.parseToInt(arr[6]),
        buybackContract: Web3.utils.toChecksumAddress(arr[7]),
        buybackAmount: ethers.BigNumber.from(arr[8]),
    };
}

/**
 * Parses the input to a valid integer number. Note that NaN or Infinity values
 * are invalid number.
 * @param {Any} input Numeric value.
 */
window.p.parseToInt = function (input) {
    const value = parseInt(input);

    if (isNaN(value) || !isFinite(value)) {
        throw new Error(`Invalid integer number ${value}`);
    }
    return value;
}

/**
 * Creates a cryptographic claim from the provided asset data.
 * @param {Object} item CSV line data.
 */
window.p.generateAssetClaim = function (asset) {
    return ethers.utils.keccak256(
        Web3.utils.hexToBytes([
            '0x',
            Web3.utils.toHex(`${p.NAMESPACE}.sellWithBuybackOffer|`).substr(2),
            asset.offeror.substr(2),
            asset.nftContract.substr(2),
            Web3.utils.leftPad(asset.nftId.toHexString(), 64).substr(2),
            Web3.utils.leftPad(asset.saleExpiration, 64).substr(2),
            asset.saleContract.substr(2),
            Web3.utils.leftPad(asset.saleAmount.toHexString(), 64).substr(2),
            Web3.utils.leftPad(asset.termUntilCollateralAtRisk, 64).substr(2),
            asset.buybackContract.substr(2),
            Web3.utils.leftPad(asset.buybackAmount.toHexString(), 64).substr(2),
        ].join('')),
    );
}

window.p.buildMerkleTree = function(claims) {
    const elements = claims.map((c) => {
        return buffer.Buffer.from(c.substr(2), 'hex');
    });

    console.log(elements);

    const tree = new p.MerkleTree(elements);
    const proofs = tree.getHexProof(elements[0]);
    console.log('proofs:', proofs);
    const root = tree.getHexRoot();
    console.log(root);
    // const rootContract = await testContract.instance.methods.merkleProof(
    //   '0x44e44897FC076Bc46AaE6b06b917D0dfD8B2dae9',
    //   '0x44e44897FC076Bc46AaE6b06b917D0dfD8B2dae9',
    //   1,
    //   1,
    //   '0x44e44897FC076Bc46AaE6b06b917D0dfD8B2dae9',
    //   1,
    //   1,
    //   '0x44e44897FC076Bc46AaE6b06b917D0dfD8B2dae9',
    //   2,
    //   proofs
    // ).call();

}


// BROKER-FILE 
// $('#broker-file').on('change', async (e) => {
//     const file = e.target.files[0];
//     if (file.type != 'text/csv') {
//         throw new Error(p.ERROR['00000001']);
//     }

//     const txt = await p.readFileToString(file);
//     if (!txt) {
//         throw new Error(p.ERROR['00000002']);
//     }

//     const csv = p.parseStringToCsv(txt);
//     if (csv instanceof Error) {
//         console.error(csv);
//         throw new Error(p.ERROR['00000003']);
//     }

//     for (const arr of csv) {
//         const asset = p.parseArrayToAsset(arr);
//         const claim = p.generateAssetClaim(asset);
//         console.log("ASSET:", claim, asset.nftId);
//     }
// });


// TEST MERKLE
const claim1 = p.generateAssetClaim(
    p.parseArrayToAsset([
        '0x44e44897FC076Bc46AaE6b06b917D0dfD8B2dae9',
        '0x44e44897FC076Bc46AaE6b06b917D0dfD8B2dae9',
        1,
        1,
        '0x44e44897FC076Bc46AaE6b06b917D0dfD8B2dae9',
        1,
        1,
        '0x44e44897FC076Bc46AaE6b06b917D0dfD8B2dae9',
        2
    ])
);
const claim2 = p.generateAssetClaim(
    p.parseArrayToAsset([
        '0x44e44897FC076Bc46AaE6b06b917D0dfD8B2dae9',
        '0x44e44897FC076Bc46AaE6b06b917D0dfD8B2dae9',
        2,
        1,
        '0x44e44897FC076Bc46AaE6b06b917D0dfD8B2dae9',
        1,
        1,
        '0x44e44897FC076Bc46AaE6b06b917D0dfD8B2dae9',
        2
    ])
); 
const claim3 = p.generateAssetClaim(
    p.parseArrayToAsset([
        '0x44e44897FC076Bc46AaE6b06b917D0dfD8B2dae9',
        '0x44e44897FC076Bc46AaE6b06b917D0dfD8B2dae9',
        3,
        1,
        '0x44e44897FC076Bc46AaE6b06b917D0dfD8B2dae9',
        1,
        1,
        '0x44e44897FC076Bc46AaE6b06b917D0dfD8B2dae9',
        2
    ])
);

const claims = [claim1, claim2, claim3];
const merkleTree = p.buildMerkleTree(claims);
