import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const data = [
    { date: '12/24', weight: 80.0 },
    { date: '12/25', weight: 80.0 },
    { date: '12/26', weight: 80.0 },
    { date: '12/27', weight: 80.0 },
    { date: '12/28', weight: 79.8 },
    { date: '12/29', weight: 75.0 }, // Dramatic drop for demo like image
    { date: '12/30', weight: 65.0 },
    { date: '12/31', weight: 65.0 },
];

export function WeightTrendChart() {
    return (
        <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            height: '100%',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>体重推移</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                過去30日間の体重変化
            </p>

            <div style={{ flex: 1, width: '100%', minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#E9ECEF" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#868e96' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#868e96' }}
                            domain={['dataMin - 5', 'dataMax + 2']}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="weight"
                            stroke="#5c7cfa"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
