export const ConfigKey = {
    // パスワード
    AdminPass: 'AdminPass',
    PriorityPass: 'PriorityPass',
    // システムから利用を許可するライセンストークン数
    AvailableTokenCount: 'AvailableTokenCount'
};
export const JobStatus = {
    Waiting: 'Waiting',
    Ready: 'Ready',
    Starting: 'Starting',
    Running: 'Running',
    Completed: 'Completed',
    Failed: 'Failed',
    Missing: 'Missing'
};
export const JobPriority = {
    VeryHigh: 5,
    High: 4,
    Middle: 3,
    Low: 2,
    VeryLow: 1
};
