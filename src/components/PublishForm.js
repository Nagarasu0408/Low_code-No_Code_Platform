import React, { useState } from "react";
import "./styles.css";

const PublishForm = () => {
    const [accessToken, setAccessToken] = useState("");
    const [repoName, setRepoName] = useState("");
    const [username, setUsername] = useState("");
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleFileUpload = (e) => {
        setFiles(e.target.files);
    };

    const handlePublish = async (e) => {
        e.preventDefault();

        if (!accessToken || !repoName || !username) {
            alert("All fields are required!");
            return;
        }

        setLoading(true);

        try {
            // Step 1: Create Repository
            console.log("Creating repository:", repoName);
            const createRepoResponse = await fetch("https://api.github.com/user/repos", {
                method: "POST",
                headers: {
                    Authorization: `token ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: repoName.trim(), // Ensure no leading/trailing spaces
                    description: "Automatically created by Publish Button",
                    private: false, // Set to true for private repositories
                }),
            });

            if (!createRepoResponse.ok) {
                const errorResponse = await createRepoResponse.json();
                console.error("Create Repo Error:", errorResponse);
                throw new Error(errorResponse.message || "Failed to create repository.");
            }

            console.log("Repository created successfully!");

            // Step 2: Upload Files (if any)
            const baseUrl = `https://api.github.com/repos/${username}/${repoName}/contents/`;
            for (const file of files) {
                const content = await file.text();
                console.log(`Uploading file: ${file.name}`);
                const uploadResponse = await fetch(baseUrl + file.name, {
                    method: "PUT",
                    headers: {
                        Authorization: `token ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message: `Add ${file.name}`,
                        content: btoa(content), // Base64 encode file content
                    }),
                });

                if (!uploadResponse.ok) {
                    const uploadError = await uploadResponse.json();
                    console.error("Upload File Error:", uploadError);
                    throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
                }
            }

            // Step 3: Enable GitHub Pages
            const enablePagesResponse = await fetch(
                `https://api.github.com/repos/${username}/${repoName}/pages`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `token ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        source: {
                            branch: "main",
                            path: "/",
                        },
                    }),
                }
            );

            if (!enablePagesResponse.ok) {
                const pagesError = await enablePagesResponse.json();
                console.error("Enable Pages Error:", pagesError);
                throw new Error("Failed to enable GitHub Pages.");
            }

            const websiteUrl = `https://${username}.github.io/${repoName}/`;
            alert(`Website published! View it here: ${websiteUrl}`);
            window.open(websiteUrl, "_blank");

        } catch (error) {
            console.error("Error during publishing:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="form-container">
            <h2>Publish Website</h2>
            <form onSubmit={handlePublish}>
                <label htmlFor="accessToken">GitHub Access Token:</label>
                <input
                    type="password"
                    id="accessToken"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Enter your GitHub personal access token"
                />

                <label htmlFor="repoName">Repository Name:</label>
                <input
                    type="text"
                    id="repoName"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="Enter repository name"
                />

                <label htmlFor="username">GitHub Username:</label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your GitHub username"
                />

                <label htmlFor="fileUpload">Upload Files:</label>
                <input
                    type="file"
                    id="fileUpload"
                    onChange={handleFileUpload}
                    multiple
                    accept=".html,.css,.js"
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Publishing..." : "Publish"}
                </button>
            </form>
        </div>
    );
};

export default PublishForm;
