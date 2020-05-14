import { getStdout } from '../PowerShellRemote.js';

export default async function setupInputFromSharedDirectory(node, sorceDir, workingDir, inputfileName, newName = '') {
  return getStdout(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, build(sorceDir, workingDir, inputfileName, newName));
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
    $inputs = @($(Get-ChildItem $sourceDir -Filter '*.inp' | Foreach-Object { $_.Name }))
    if (-not $inputs.Contains($inputfileName)) {
      throw "No input file: $inputfileName"
    }

    # 作業ディレクトリがなければ作る
    if (-not $(Test-Path $workingDir)) {
      New-Item $workingDir -ItemType Directory > $null
    }

    if($inputs.Length -eq 1) {
      # input が1つならディレクトリを移動する
      Rename-Item $sourceDir -NewName $newName -PassThru | Move-Item -Destination $workingDir
    } else {
      # input が複数なら元ディレクトリは残し、inputファイルだけ減らす
      $tempDir = "\${sourceDir}\\..\\\${newName}\\"
      New-Item $tempDir -ItemType Directory > $null
      Move-Item -Path "\${sourceDir}\\\${inputfileName}" -Destination $tempDir
      Get-ChildItem -Path $sourceDir -Exclude '*.inp' | Copy-Item -Destination $tempDir -Recurse

      Move-Item -Path $tempDir -Destination $workingDir
    }
  
    }
}`;
