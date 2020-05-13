import { getStdout } from '../PowerShellRemote.js';

export default async function setupInputFromSharedDirectory(node, sorceDir, workingDir, newName = '') {
  return getStdout(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, build(sorceDir, workingDir, newName));
}

const build = (sourceDir, workingDir, inputfileName, newName) => `{
  param ($Session)
  Invoke-Command -Session $Session -ScriptBlock  {
    $sourceDir = '${sourceDir}'
    $workingDir = '${workingDir}'
    $inputfileName = '${inputfileName}'
    $newName = '${newName}'
    $dirName = [System.IO.Path]::GetFileName($sourceDir)

    # inputfile があるか？
    $inputs = @($(Get-ChildItem $sourceDir -Filter '*.inp').Name)
    if (-not $inputs.Contains($inputfileName)) {
      throw "No input file: $inputfileName"
    }

    # 作業ディレクトリがなければ作る
    if (-not $(Test-Path $workingDir)) {
      New-Item $workingDir -ItemType Directory > $null
    }

    if($inputs.Length -eq 1) {
      # input が1つならディレクトリを移動する
      Move-Item -Path $sourceDir -Destination $workingDir
    } else {
      # input が複数なら
      # ディレクトリをコピーし、不要なインプットファイルを除去する
      Copy-Item -Path $sourceDir -Destination $workingDir -Recurse
      Remove-Item -Path "\${sourceDir}\\\${inputfileName}" -Force
      Remove-Item -Path "\${workingDir}\\\${dirName}\\*.inp" -Exclude $inputfileName -Force
    }
  
    if ($newName) {
      Rename-Item "\${workingDir}\\\${dirName}" -NewName $newName
    }
}`;
