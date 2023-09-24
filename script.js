document.addEventListener("DOMContentLoaded", function () {
    const inputText = document.getElementById("inputText");
    const outputText = document.getElementById("outputText");
    const encryptButton = document.getElementById("encryptButton");
    const decryptButton = document.getElementById("decryptButton");

    const clearButton = document.getElementById("clearButton");

    clearButton.addEventListener("click", () => {
        outputText.value = ""; // Clear the output textarea
    });

    const copyButton = document.getElementById("copyButton");

    copyButton.addEventListener("click", () => {
        // Select the output text area
        outputText.select();
        // Copy the selected text to the clipboard
        document.execCommand("copy");
        // Deselect the text area
        outputText.blur();
    });

    encryptButton.addEventListener("click", async () => {
        const text = inputText.value;
        const password = prompt("Enter encryption password:");
        if (password) {
            try {
                const encryptedText = await encrypt(text, password);
                outputText.value = encryptedText;
            } catch (error) {
                console.error("Encryption error:", error);
            }
        }
    });

    decryptButton.addEventListener("click", async () => {
        const encryptedText = inputText.value;
        const password = prompt("Enter decryption password:");
        if (password) {
            try {
                const decryptedText = await decrypt(encryptedText, password);
                outputText.value = decryptedText;
            } catch (error) {
                console.error("Decryption error:", error);
            }
        }
    });

    async function encrypt(text, password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const passwordBuffer = encoder.encode(password);

        const key = await crypto.subtle.importKey(
            "raw",
            passwordBuffer,
            "PBKDF2",
            false,
            ["deriveKey"]
        );

        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256",
            },
            key,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );

        const encryptedData = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            derivedKey,
            data
        );

        const saltAndIv = new Uint8Array([...salt, ...iv]);
        const encryptedText = new Uint8Array([...saltAndIv, ...new Uint8Array(encryptedData)]);
        return btoa(String.fromCharCode.apply(null, encryptedText));
    }

    async function decrypt(encryptedText, password) {
        const decoder = new TextDecoder("utf-8");
        const encryptedData = atob(encryptedText);
        const encryptedArray = new Uint8Array([...encryptedData].map((c) => c.charCodeAt(0)));

        const salt = encryptedArray.slice(0, 16);
        const iv = encryptedArray.slice(16, 28);
        const encryptedContent = encryptedArray.slice(28);

        const passwordBuffer = new TextEncoder().encode(password);
        const key = await crypto.subtle.importKey(
            "raw",
            passwordBuffer,
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256",
            },
            key,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );

        const decryptedData = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            derivedKey,
            encryptedContent
        );

        return decoder.decode(decryptedData);
    }
});