/* SYNCHRONIX Futuristic Upgrade
   Non-invasive UI layer. The original script.js remains the simulator engine.
*/
(() => {
    "use strict";

    const $ = (id) => document.getElementById(id);
    let uptimeSeconds = 0;
    let lastPriority = "";
    let lastCounts = "";
    let activityTimer = null;
    let compact = false;
    let motion = true;

    function readCounts() {
        const ids = ["North", "East", "South", "West"];
        return Object.fromEntries(ids.map(r => [r.toLowerCase(), Number($("input" + r)?.value || 0)]));
    }

    function totalCounts(c) { return Object.values(c).reduce((a,b) => a + b, 0); }

    function density(c) {
        const max = Math.max(...Object.values(c));
        if (max >= 40) return "HIGH";
        if (max >= 20) return "MEDIUM";
        return "LOW";
    }

    function addActivity(title, detail, type="cyan") {
        const list = $("activityList");
        if (!list) return;
        const item = document.createElement("div");
        item.className = "activity-item";
        item.innerHTML = `<span class="activity-dot ${type}"></span>
            <div><b>${title}</b><small>${detail}</small></div>
            <time>NOW</time>`;
        list.prepend(item);
        while (list.children.length > 5) list.removeChild(list.lastElementChild);
    }

    function syncTelemetry() {
        const c = readCounts();
        const total = totalCounts(c);
        const priorityText = ($("activeRoadTitle")?.textContent || "NORTH GREEN").replace(/\s+GREEN.*/i,"").trim();
        const mode = document.querySelector('input[name="signalMode"]:checked')?.value || "ai";

        const latency = Math.max(11, Math.min(28, 11 + Math.round(total / 12)));
        const confidence = Math.max(91, Math.min(99.8, 99.4 - Math.max(...Object.values(c)) / 100 * 1.8));
        const efficiency = Math.max(72, Math.min(98, Math.round(100 - total / 7.2)));

        if ($("telemetryLatency")) $("telemetryLatency").textContent = latency + " ms";
        if ($("telemetryConfidence")) $("telemetryConfidence").textContent = confidence.toFixed(1) + "%";
        if ($("telemetryMode")) $("telemetryMode").textContent = mode === "fixed" ? "FIXED" : "ADAPTIVE";
        if ($("efficiencyValue")) $("efficiencyValue").textContent = efficiency + "%";
        if ($("performanceScore")) $("performanceScore").textContent = efficiency;
        if ($("queueReduction")) $("queueReduction").textContent = "+" + Math.max(8, Math.round((100-total/2.2))) + "%";
        if ($("signalUtilization")) $("signalUtilization").textContent = Math.max(72, 100 - Math.round(total/8)) + "%";

        const ring = document.querySelector(".efficiency-ring");
        if (ring) ring.style.background = `conic-gradient(var(--green) 0 ${efficiency}%, #1a2a3d ${efficiency}% 100%)`;

        const newCounts = JSON.stringify(c);
        if (newCounts !== lastCounts) {
            if (lastCounts) addActivity("Traffic inputs updated", `${total} vehicles across four approaches`, "cyan");
            lastCounts = newCounts;
        }

        if (priorityText && priorityText !== lastPriority) {
            if (lastPriority) addActivity("Priority changed", `${priorityText} received green priority`, "green");
            lastPriority = priorityText;
        }

        // Keep the visual network nodes synced.
        [["N",c.north],["E",c.east],["S",c.south],["W",c.west]].forEach(([letter,val]) => {
            const node = [...document.querySelectorAll(".network-node")].find(n => n.textContent.trim().startsWith(letter));
            if (node) {
                const b = node.querySelector("b");
                if (b) b.textContent = val;
            }
        });

        // Highlight the selected road in the command map and intersection.
        document.querySelectorAll(".network-node").forEach(n => n.classList.remove("priority-emphasis"));
        const selected = [...document.querySelectorAll(".network-node")].find(n => n.textContent.trim().startsWith(priorityText.charAt(0)));
        if (selected) selected.classList.add("priority-emphasis");

        // Update uptime.
        uptimeSeconds++;
        if ($("telemetryUptime")) $("telemetryUptime").textContent = uptimeSeconds > 86400 ? "99.99%" : "99.98%";
    }

    window.toggleControlDrawer = function() {
        $("controlDrawer")?.classList.toggle("hidden");
    };

    window.toggleCompactMode = function() {
        compact = !compact;
        document.body.classList.toggle("compact-ui", compact);
        addActivity(compact ? "Compact view enabled" : "Comfortable view restored", "Interface density changed", "purple");
    };

    window.setInterfaceDensity = function(mode, btn) {
        compact = mode === "compact";
        document.body.classList.toggle("compact-ui", compact);
        document.querySelectorAll(".segmented button").forEach(b => b.classList.remove("selected"));
        btn?.classList.add("selected");
    };

    window.toggleMotion = function(btn) {
        motion = !motion;
        document.body.classList.toggle("no-motion", !motion);
        btn?.classList.toggle("selected", motion);
        const label = btn?.querySelector("b");
        if (label) label.textContent = motion ? "Enabled" : "Disabled";
    };

    window.togglePipeline = function(input) {
        const flow = document.querySelector(".thinking-card");
        if (flow) flow.style.display = input.checked ? "" : "none";
    };

    window.toggleTelemetry = function(input) {
        document.querySelector(".telemetry-grid")?.classList.toggle("hidden", !input.checked);
    };

    window.togglePriorityGlow = function(input) {
        document.body.classList.toggle("priority-glow-off", !input.checked);
        document.querySelectorAll(".priority-emphasis").forEach(el => el.classList.toggle("priority-emphasis", input.checked));
    };

    window.clearActivityLog = function() {
        const list = $("activityList");
        if (list) list.innerHTML = '<div class="activity-item"><span class="activity-dot green"></span><div><b>Event stream cleared</b><small>Waiting for new system activity</small></div><time>NOW</time></div>';
    };

    // Add a few useful event messages during a running simulation.
    activityTimer = setInterval(() => {
        const c = readCounts();
        const max = Math.max(...Object.values(c));
        if (max >= 40) {
            addActivity("Congestion monitor alert", "Adaptive timing is compensating for a heavy queue", "red");
        } else if (max >= 20) {
            addActivity("Traffic balanced", "Signal timing remains within adaptive range", "yellow");
        } else {
            addActivity("Network stable", "All approaches are below congestion threshold", "green");
        }
    }, 9000);

    setInterval(syncTelemetry, 1000);
    setTimeout(syncTelemetry, 250);
})();
