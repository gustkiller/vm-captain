
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";

export type ResourceType = 'cpu' | 'memory' | 'disk' | 'network';

interface ResourceChartProps {
  title: string;
  type: ResourceType;
  value: number;
  data: { time: string; value: number }[];
  unit?: string;
}

const typeConfig = {
  cpu: {
    color: "#3b82f6", // blue
    name: "CPU"
  },
  memory: {
    color: "#8b5cf6", // purple
    name: "Memory"
  },
  disk: {
    color: "#10b981", // green
    name: "Disk"
  },
  network: {
    color: "#f59e0b", // amber
    name: "Network"
  }
};

export function ResourceChart({ title, type, value, data, unit = "%" }: ResourceChartProps) {
  const { color } = typeConfig[type];
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div
          className="h-4 w-4 rounded-full"
          style={{ backgroundColor: color }}
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}{unit}</div>
        <div className="h-[80px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Time
                            </span>
                            <span className="font-bold text-xs">
                              {payload[0].payload.time}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {type}
                            </span>
                            <span className="font-bold text-xs">
                              {payload[0].value}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
