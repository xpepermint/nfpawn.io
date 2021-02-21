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

/**
 * Signs a root hash of the order's merkle tree.
 * 
 * @param hash Order's merkle tree root.
 */
async function signOrder(merkleRoot) {
    const web3 = new Web3(window.ethereum);
    await window.ethereum.enable();
    const account = (await web3.eth.getAccounts())[0];
    const seed = Web3.utils.leftPad(new Date().getTime(), 64).substr(2);
    const claim = `0x${Web3.utils.toHex(`${window.NAMESPACE}.order`).substr(2)}${merkleRoot}${seed}`;
    const data = web3.utils.sha3(claim);
    const signature = await web3.eth.sign(data, account);
    return {
        account,
        seed,
        claim,
        data,
        signature,
        signatureKind: 0,
    };
}

/**
 * Applyes merkle tree keys to each received item.
 * @param {Array} offers List of offers.
 */
window.p.assignMerkleData = async function(offers) {
    const claims = offers.map((i) => i.claim);
    const elements = claims.map((c) => {
        return buffer.Buffer.from(c.substr(2), 'hex');
    });

    const tree = new p.MerkleTree(elements);
    const root = tree.getHexRoot();

    const { signature } = await signOrder(root);

    offers.forEach((o, i) => { // add to item
        o.merkleRoot = root;
        o.merkleProofs = tree.getHexProof(elements[i]);
        o.signature = signature;
    });
}

/**
 * Builds NFT offer records from a CSV data.
 * @param {Array} csv List of CSV data.
 */
window.p.buildOffers = async function(csv) {
    const offers = [];

    for (const arr of csv) {
        const asset = p.parseArrayToAsset(arr);
        const claim = p.generateAssetClaim(asset);

        let offer = { ...asset, claim };
        offer.nftId = offer.nftId.toHexString();
        offer.saleAmount = offer.saleAmount.toHexString();
        offer.buybackAmount = offer.buybackAmount.toHexString();

        offers.push(offer);
    }
    await p.assignMerkleData(offers);

    return offers;
}

/**
 * Processes and uploads the offer file.
 * @param {File} file Reference to the CSV file.
 */
window.p.createFileOffers = async function(file) {
    if (file.type != 'text/csv') {
        throw new Error(p.ERROR['00000001']);
    }

    const txt = await p.readFileToString(file);
    if (!txt) {
        throw new Error(p.ERROR['00000002']);
    }

    const csv = p.parseStringToCsv(txt);
    if (csv instanceof Error) {
        console.error(csv);
        throw new Error(p.ERROR['00000003']);
    }

    const offers = await p.buildOffers(csv);
    let res = await fetch(`${window.API_BASE}/offers/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(offers)
    }).then((res) => {
      return res.json();
    }).catch((error) => {
      console.error(error);
      return { error: error.message };
    });

    console.log("RES:", res);
}

/**
 * Installs the event on the FILE input which builds the items
 * @param {Array} csv List of CSV data.
 */
$('#broker-exec').on('click', async (e) => {
    const file = $('#broker-file').get(0).files[0];
    await p.createFileOffers(file);
});
