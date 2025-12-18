import { Octokit } from '@octokit/rest';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function main() {
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });
  
  const { data: prs } = await octokit.pulls.list({
    owner: 'relight14',
    repo: 'ChrisCillizza',
    state: 'open'
  });
  
  console.log('=== Open Pull Requests ===');
  if (prs.length === 0) {
    console.log('No open PRs found');
    return;
  }
  
  for (const pr of prs) {
    console.log('\nPR #' + pr.number + ': ' + pr.title);
    console.log('  Branch: ' + pr.head.ref);
    console.log('  URL: ' + pr.html_url);
    
    const { data: files } = await octokit.pulls.listFiles({
      owner: 'relight14',
      repo: 'ChrisCillizza',
      pull_number: pr.number
    });
    
    console.log('  Files changed: ' + files.length);
    for (const file of files) {
      console.log('\n  === ' + file.filename + ' ===');
      console.log('  Status: ' + file.status);
      console.log('  Changes: +' + file.additions + ' -' + file.deletions);
      if (file.patch) {
        console.log('\n  Patch:');
        console.log(file.patch);
      }
    }
  }
}

main().catch(console.error);
