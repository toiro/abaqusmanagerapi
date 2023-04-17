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
        #| Feature | Version | Max Release | Model | Type | Number | InUse | Expires | Server Name | Customer ID
        if($line.startswith("|")) {
          $rawData = ($line -split "\|").trim()
          $entry = @{
            Feature = $rawData[1];
            Version = $rawData[2];
            MaxRelease = $rawData[3]
            Model = $rawData[4];
            Type = $rawData[5];
            Number = $rawData[6];
            InUse = $rawData[7];
            Expires = $rawData[8];
            ServerName = $rawData[9];
            CustomerID = $rawData[10]
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
