import { getJSON } from '../PowerShellRemote.js';

export default async function getDslsstat(node, path) {
  return getJSON(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, build(path));
}

const build = path => `{
  param ($Session)
  Invoke-Command -Session $Session -ScriptBlock  {
    abaqus licensing dslsstat | .{
      begin {
        $ret = @{
          Server = @{};
          Licenses = @()
        }

        $section = ""
      }
      process {
        if($_.startswith("Server:")) {
          $section = "Server"
        } elseif($_.startswith("Licenses:")) {
          $section = "Licenses"
        }
        $line = $_
        switch ($section) {
          "Server" {
            if($line.startswith("  ")) {
              $rawData = ($line -split ": ").trim()
              $ret.Server[$rawData[0]] = $rawData[1]
            }
          }
          "Licenses" {
            #+ Feature                   | Version | Model           | Type  | Number    | InUse   | Expires              | Server Name          | Customer ID
            if($line.startswith("|")) {
              $rawData = ($line -split "\\|").trim()
              $entry = @{
                Feature = $rawData[1];
                Version = $rawData[2];
                Model = $rawData[3];
                Type = $rawData[4];
                Number = $rawData[5];
                InUse = $rawData[6];
                Expires = $rawData[7];
                ServerName = $rawData[8];
                CustomerID = $rawData[9]
              }
              $ret.Licenses += $entry
            }
          }
        }
      }
      end {
        $ret
      }
    } | ConvertTo-Json
  }
}`;
