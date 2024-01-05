console.log('Loading function');

import AWS from 'aws-sdk';
import axios from 'axios';

export const handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    //Auf Pipeline zugreifen um Hash des Commits zu extrahieren
    AWS.config.update({ region: 'eu-west-1' });
    const pipelineName = 'Pipeline';
    const pipelineExecutionId = event.detail["execution-id"];
    const codepipeline = new AWS.CodePipeline();
    
    // Informationen zur aktuellen Ausführung abrufen
    const executionParams = {
      pipelineName,
      pipelineExecutionId
    };
    const executionResult = await codepipeline.getPipelineExecution(executionParams).promise();
    
    // Commit-Hash extrahieren
    const commitHash = executionResult.pipelineExecution.artifactRevisions[0].revisionId;
    
    console.log('Commit-Hash:', commitHash);

  // GitHub Repository Informationen
  const owner = 'etiennefrei';
  const repo = 'test-pipeline';
  
  // GitHub API-Zugriffstoken
  const githubToken = process.env.GITHUB_TOKEN;
  
  const comment = `AWS-CI: ${event.detail["pipeline"]} Stage ${event.detail["stage"]} ${event.detail["state"].toLowerCase()}`;
  
  try {
    // GitHub API-Anfrage, um das letzte Commit abzurufen
    const commitUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${commitHash}`;
    const headers = {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json'
    };
    const response = await axios.get(commitUrl, { headers });
    
    // Commit-Objekt aus der API-Antwort extrahieren
    const commit = response.data;
    
    // GitHub API-Anfrage, um einen Kommentar zum Commit zu erstellen
    const commentsUrl = commit.comments_url;
    const commentData = {
      body: comment
    };
    await axios.post(commentsUrl, commentData, { headers });
    
    return {
      statusCode: 200,
      body: 'Kommentar erfolgreich erstellt'
    };
  } catch (error) {
    console.error('Fehler beim Erstellen des Kommentars:', error);
    return {
      statusCode: 500,
      body: 'Fehler beim Erstellen des Kommentars'
    };
  }
    
};
