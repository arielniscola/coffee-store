import { useRef, useEffect, useState, FC } from "react";
import {
  Chart,
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  ChartData,
  ChartItem,
} from "chart.js";

// Import utilities
import { tailwindConfig } from "../utils/utils";

Chart.register(
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

interface BarChart03Props {
  data: ChartData<"bar">;
  width: number;
  height: number;
}

const BarChart: FC<BarChart03Props> = ({ data, width, height }) => {
  const [_chart, setChart] = useState<Chart<"bar"> | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const legend = useRef<HTMLUListElement | null>(null);

  const { tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = {
    tooltipBgColor: "#fff",
    tooltipBodyColor: "#1e293b",
    tooltipBorderColor: "#e2e8f0",
  };

  useEffect(() => {
    const reducer = (accumulator: number, currentValue: number) =>
      accumulator + currentValue;
    const values = data.datasets.map((x) => {
      // Filtra solo los números
      const numericData = (
        x.data as Array<number | [number, number] | null>
      ).filter((value): value is number => typeof value === "number");
      return numericData.reduce(reducer, 0);
    });
    const max = values.reduce(reducer, 0);

    const ctx = canvas.current as ChartItem;
    // eslint-disable-next-line no-unused-vars
    const newChart = new Chart(ctx, {
      type: "bar",
      data: data,
      options: {
        indexAxis: "y",
        layout: {
          padding: {
            top: 12,
            bottom: 12,
            left: 20,
            right: 20,
          },
        },
        scales: {
          x: {
            stacked: true,
            display: false,
            max: max as number,
          },
          y: {
            stacked: true,
            display: false,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              title: () => "",
              label: (context) => context.parsed.x.toString(),
            },
            bodyColor: tooltipBodyColor,
            backgroundColor: tooltipBgColor,
            borderColor: tooltipBorderColor,
          },
        },
        interaction: {
          intersect: false,
          mode: "nearest",
        },
        animation: {
          duration: 500,
        },
        maintainAspectRatio: false,
        resizeDelay: 200,
      },
      plugins: [
        {
          id: "htmlLegend",
          afterUpdate(c, _args, _options) {
            const ul = legend.current;
            if (!ul || !c.options.plugins?.legend?.labels) return;
            // Remove old legend items
            while (ul.firstChild) {
              ul.firstChild.remove();
            }
            // @ts-ignore
            const items = c.options.plugins.legend.labels.generateLabels(c);
            items.forEach((item) => {
              const li = document.createElement("li");
              li.style.display = "flex";
              li.style.justifyContent = "space-between";
              li.style.alignItems = "center";
              li.style.paddingTop = tailwindConfig().theme.padding[2.5];
              li.style.paddingBottom = tailwindConfig().theme.padding[2.5];
              const wrapper = document.createElement("div");
              wrapper.style.display = "flex";
              wrapper.style.alignItems = "center";
              const box = document.createElement("div");
              box.style.width = tailwindConfig().theme.width[3];
              box.style.height = tailwindConfig().theme.width[3];
              box.style.borderRadius = tailwindConfig().theme.borderRadius.sm;
              box.style.marginRight = tailwindConfig().theme.margin[3];
              box.style.backgroundColor = item.fillStyle as string;
              const label = document.createElement("div");
              const value = document.createElement("div");
              value.style.fontWeight = tailwindConfig().theme.fontWeight.medium;
              value.style.marginLeft = tailwindConfig().theme.margin[3];
              value.style.color =
                item.text === "Other"
                  ? tailwindConfig().theme.colors.slate[400]
                  : (item.fillStyle as string);
              const theValue: number = c.data.datasets[
                item.datasetIndex as number
              ].data.reduce((a: number, b: any) => a + b, 0);
              const valueText = document.createTextNode(
                `${Math.round((theValue / max) * 100)}%`
              );
              const labelText = document.createTextNode(item.text);
              value.appendChild(valueText);
              label.appendChild(labelText);
              ul.appendChild(li);
              li.appendChild(wrapper);
              li.appendChild(value);
              wrapper.appendChild(box);
              wrapper.appendChild(label);
            });
          },
        },
      ],
    });
    // @ts-ignore
    setChart(newChart);
    return () => newChart.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div className="grow flex flex-col justify-center">
      <div>
        <canvas ref={canvas} width={width} height={height}></canvas>
      </div>
      <div className="px-5 pt-2 pb-2">
        <ul
          ref={legend}
          className="text-sm divide-y divide-slate-100 dark:divide-slate-700"
        ></ul>
        <ul className="text-sm divide-y divide-slate-100 dark:divide-slate-700"></ul>
      </div>
    </div>
  );
};

export default BarChart;
