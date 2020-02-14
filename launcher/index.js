import from2Array from 'from2-array';
import through from 'through2';

// ***ジョブ起動***
// Waiting のジョブを取得する
const waitingJobs = [];

// priority - createdAt 順に並べる
waitingJobs.sort((a, b) => a.priority !== b.priority ? a.priority - b.priority : a.createdAt - b.createdAt);

from2Array.obj(waitingJobs)
  .pipe(through.obj((chunk, enc, cb) => {
    cb();
  }));
// 以下の条件をチェックする
// - 対象のノードで同時に実行するジョブ数に余裕があること
// - オーナーの同時に実行するジョブ数に余裕があること
// - 残りライセンス数で起動可能であること
// 条件を満たしていたら起動する
// 起動したら Progress に起動状態を追加する
// 終了したら正常終了かエラー化を判定し、Progress に追加する

// PowerShell リモート設定
// Enable-PSRemoting -SkipNetworkProfileCheck
// Set-Item WSMan:\localhost\Client\TrustedHosts -Value *
