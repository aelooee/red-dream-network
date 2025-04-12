document.addEventListener("DOMContentLoaded", () => {
    // 获取容器尺寸
    const container = document.getElementById("graph");
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 创建 SVG
    const svg = d3.select("#graph")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    // 创建缩放容器
    const g = svg.append("g");

    // 添加缩放功能
    const zoom = d3.zoom()
        .scaleExtent([0.5, 3])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });
    svg.call(zoom);

    // 重置缩放按钮
    d3.select("#reset-zoom").on("click", () => {
        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity);
    });

    // 创建悬停提示框
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // 加载 JSON 数据
    d3.json("data.json").then(data => {
        if (!data.nodes || !data.links) {
            throw new Error("数据格式错误：nodes 或 links 缺失");
        }
        renderGraph(data);
    }).catch(error => {
        console.error("加载数据失败:", error);
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("fill", "#f5222d")
            .text(`数据加载失败：${error.message}。请检查 data.json 文件是否存在或路径是否正确`);
    });

    // 渲染力导向图
    function renderGraph(data) {
        const simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.links)
                .id(d => d.id)
                .distance(d => {
                    if (d.type === "恋爱" || d.type === "婚姻") return 60;
                    if (d.type === "家庭") return 80;
                    return 100;
                })
                .strength(d => d.strength || 0.5)
            )
            .force("charge", d3.forceManyBody().strength(-80))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(20));

        const link = g.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(data.links)
            .join("line");

        const node = g.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("circle")
            .data(data.nodes)
            .join("circle")
            .attr("r", d => {
                if (d.group === "主角") return 10;
                if (d.group === "正册") return 8;
                return 6;
            })
            .attr("fill", d => {
                if (d.group === "主角") return "#ff4d4f";
                if (d.group === "正册") return "#40a9ff";
                if (d.group === "副册") return "#73d13d";
                if (d.group === "又副册") return "#ffec3d";
                return "#d9d9d9";
            })
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
            .on("mouseover", (event, d) => {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                tooltip.html(`${d.name}<br>${d.info}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0);
            })
            .on("click", (event, d) => {
                const modal = document.getElementById("info-modal");
                const modalName = document.getElementById("modal-name");
                const modalInfo = document.getElementById("modal-info");
                modalName.textContent = d.name;
                modalInfo.textContent = d.info;
                modal.style.display = "flex";
            });

        const label = g.append("g")
            .selectAll("text")
            .data(data.nodes)
            .join("text")
            .text(d => d.name)
            .attr("font-size", 12)
            .attr("dx", 12)
            .attr("dy", 4);

        document.querySelector(".close").addEventListener("click", () => {
            document.getElementById("info-modal").style.display = "none";
        });

        simulation.on("tick", () => {
            const padding = 50;
            const bounds = {
                minX: d3.min(data.nodes, d => d.x) - padding,
                maxX: d3.max(data.nodes, d => d.x) + padding,
                minY: d3.min(data.nodes, d => d.y) - padding,
                maxY: d3.max(data.nodes, d => d.y) + padding
            };

            const viewBoxWidth = bounds.maxX - bounds.minX;
            const viewBoxHeight = bounds.maxY - bounds.minY;
            svg.attr("viewBox", `${bounds.minX} ${bounds.minY} ${viewBoxWidth} ${viewBoxHeight}`);

            data.nodes.forEach(d => {
                d.x = Math.max(padding, Math.min(width - padding, d.x));
                d.y = Math.max(padding, Math.min(height - padding, d.y));
            });

            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            label
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        });

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    }
});