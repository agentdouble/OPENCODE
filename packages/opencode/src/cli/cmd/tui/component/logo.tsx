import { TextAttributes } from "@opentui/core"
import { For, createSignal, onCleanup, onMount } from "solid-js"
import { useKV } from "../context/kv"

// Ombre faible
const LOGO_MIA_OMBRE_FAIBLE = [
  "██░    ███░  ██░   █████░  ",
  "███░  ████░  ██░  ██   ██░ ",
  "██ ████ ██░  ██░  ███████░ ",
  "██  ██  ██░  ██░  ██   ██░ ",
  "██      ██░  ██░  ██   ██░ ",
]

// Ombre forte
const LOGO_MIA_OMBRE_FORTE = [
  "██▒    ███▒  ██▒   █████▒  ",
  "███▒  ████▒  ██▒  ██   ██▒ ",
  "██ ████ ██▒  ██▒  ███████▒ ",
  "██  ██  ██▒  ██▒  ██   ██▒ ",
  "██      ██▒  ██▒  ██   ██▒ ",
]

const LOGO_MIA_COMPACT = [
  "██▒    ███▒  ██▒   █████▒  ",
  "██ ████ ██▒  ██▒  ███████▒ ",
  "██      ██▒  ██▒  ██   ██▒ ",
]

const PIXEL_LOGO_POSES = {
  idle: [
    "   C  C   ",
    "  AAAAAA  ",
    " AA AA AA ",
    "  AAAAAA  ",
  ],
  earsIn: [
    "    CC    ",
    "  AAAAAA  ",
    " AA AA AA ",
    "  AAAAAA  ",
  ],
  blink: [
    "   C  C   ",
    "  AAAAAA  ",
    " AAAAAAAA ",
    "  AAAAAA  ",
  ],
  lookLeft: [
    "  C  C    ",
    " AAAAAA   ",
    "AA AA AA  ",
    " AAAAAA   ",
  ],
  lookRight: [
    "    C  C  ",
    "   AAAAAA ",
    "  AA AA AA",
    "   AAAAAA ",
  ],
  squish: [
    "   C  C   ",
    " AAAAAAAA ",
    " AA AA AA ",
    " AAAAAAAA ",
  ],
  perk: [
    "  C    C  ",
    "   AAAA   ",
    " AA AA AA ",
    "  AAAAAA  ",
  ],
  duck: [
    "          ",
    "   C  C   ",
    "  AAAAAA  ",
    " AA AA AA ",
  ],
} as const

type MascotPose = keyof typeof PIXEL_LOGO_POSES
type AnimationStep = { pose: MascotPose; delay: number }
type AnimationFamily =
  | "blink"
  | "doubleBlink"
  | "earWiggle"
  | "glance"
  | "scan"
  | "curious"
  | "bounce"
  | "rest"

const PIXEL_LOGO_COLORS: Record<string, string> = {
  A: "#86ADD0",
  B: "#6C97BF",
  C: "#9FC3E3",
}

function randomBetween(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

export function Logo() {
  const kv = useKV()
  const blue = "#007bff"
  const [pose, setPose] = createSignal<MascotPose>("idle")

  // Choisis ici le logo à afficher :
  // const selected = LOGO_MIA_OMBRE_FAIBLE
  const selected = LOGO_MIA_COMPACT

  onMount(() => {
    if (!kv.get("animations_enabled", true)) return
    let timeout: ReturnType<typeof setTimeout> | undefined
    let stopped = false

    let lastFamily: AnimationFamily | undefined

    const animationWeights: { name: AnimationFamily; weight: number }[] = [
      { name: "blink", weight: 18 },
      { name: "doubleBlink", weight: 10 },
      { name: "earWiggle", weight: 16 },
      { name: "glance", weight: 16 },
      { name: "scan", weight: 12 },
      { name: "curious", weight: 12 },
      { name: "bounce", weight: 8 },
      { name: "rest", weight: 8 },
    ]

    function createBlink(): AnimationStep[] {
      return [
        { pose: "blink", delay: randomBetween(70, 120) },
        { pose: "idle", delay: randomBetween(900, 2200) },
      ]
    }

    function createDoubleBlink(): AnimationStep[] {
      return [
        { pose: "blink", delay: randomBetween(60, 100) },
        { pose: "idle", delay: randomBetween(70, 130) },
        { pose: "blink", delay: randomBetween(80, 130) },
        { pose: "idle", delay: randomBetween(1300, 2400) },
      ]
    }

    function createEarWiggle(): AnimationStep[] {
      return [
        { pose: Math.random() > 0.5 ? "perk" : "earsIn", delay: randomBetween(90, 150) },
        { pose: "idle", delay: randomBetween(70, 130) },
        { pose: "earsIn", delay: randomBetween(100, 170) },
        { pose: "idle", delay: randomBetween(1000, 2000) },
      ]
    }

    function createGlance(): AnimationStep[] {
      const first = Math.random() > 0.5 ? "lookLeft" : "lookRight"
      const second = first === "lookLeft" ? "lookRight" : "lookLeft"

      if (Math.random() > 0.45) {
        return [
          { pose: first, delay: randomBetween(130, 200) },
          { pose: "idle", delay: randomBetween(1000, 1900) },
        ]
      }

      return [
        { pose: first, delay: randomBetween(130, 200) },
        { pose: "idle", delay: randomBetween(70, 120) },
        { pose: second, delay: randomBetween(140, 220) },
        { pose: "idle", delay: randomBetween(1100, 2100) },
      ]
    }

    function createScan(): AnimationStep[] {
      const first = Math.random() > 0.5 ? "lookLeft" : "lookRight"
      const second = first === "lookLeft" ? "lookRight" : "lookLeft"

      return [
        { pose: first, delay: randomBetween(140, 220) },
        { pose: "idle", delay: randomBetween(60, 110) },
        { pose: second, delay: randomBetween(140, 220) },
        { pose: "idle", delay: randomBetween(60, 110) },
        { pose: first, delay: randomBetween(100, 170) },
        { pose: "idle", delay: randomBetween(1300, 2200) },
      ]
    }

    function createCurious(): AnimationStep[] {
      const look = Math.random() > 0.5 ? "lookLeft" : "lookRight"

      return [
        { pose: "perk", delay: randomBetween(100, 170) },
        { pose: look, delay: randomBetween(130, 220) },
        { pose: "blink", delay: randomBetween(70, 110) },
        { pose: "idle", delay: randomBetween(1400, 2400) },
      ]
    }

    function createBounce(): AnimationStep[] {
      const steps: AnimationStep[] = [
        { pose: "perk", delay: randomBetween(80, 140) },
        { pose: "squish", delay: randomBetween(100, 150) },
        { pose: "idle", delay: randomBetween(80, 130) },
      ]

      if (Math.random() > 0.5) {
        steps.push(
          { pose: "duck", delay: randomBetween(90, 140) },
          { pose: "squish", delay: randomBetween(90, 140) },
          { pose: "idle", delay: randomBetween(1200, 2200) },
        )
        return steps
      }

      steps.push({ pose: "idle", delay: randomBetween(1200, 2200) })
      return steps
    }

    function createRest(): AnimationStep[] {
      return [{ pose: "idle", delay: randomBetween(2200, 4200) }]
    }

    function nextFamily() {
      const pool = animationWeights.filter((entry) => entry.name !== lastFamily)
      const total = pool.reduce((sum, entry) => sum + entry.weight, 0)
      let roll = Math.random() * total

      for (const entry of pool) {
        roll -= entry.weight
        if (roll <= 0) return entry.name
      }

      return pool[pool.length - 1]?.name ?? "blink"
    }

    function buildSequence(family: AnimationFamily): AnimationStep[] {
      switch (family) {
        case "blink":
          return createBlink()
        case "doubleBlink":
          return createDoubleBlink()
        case "earWiggle":
          return createEarWiggle()
        case "glance":
          return createGlance()
        case "scan":
          return createScan()
        case "curious":
          return createCurious()
        case "bounce":
          return createBounce()
        case "rest":
          return createRest()
      }
    }

    function run(steps: AnimationStep[], index = 0) {
      if (stopped) return
      const step = steps[index]
      setPose(step.pose)
      timeout = setTimeout(() => {
        if (index < steps.length - 1) {
          run(steps, index + 1)
          return
        }

        const family = nextFamily()
        lastFamily = family
        run(buildSequence(family))
      }, step.delay)
    }

    timeout = setTimeout(() => {
      run([{ pose: "idle", delay: randomBetween(700, 1800) }])
    }, 600)

    onCleanup(() => {
      stopped = true
      if (timeout) clearTimeout(timeout)
    })
  })

  return (
    <box flexDirection="column" width="100%" alignItems="center">
      <box flexDirection="column" alignItems="center" paddingBottom={1}>
        <For each={PIXEL_LOGO_POSES[pose()]}>
          {(line) => (
            <text wrapMode="none">
              <For each={line.split("")}>
                {(pixel) => {
                  const bg = PIXEL_LOGO_COLORS[pixel]
                  if (!bg) return " "
                  return <span style={{ bg }}> </span>
                }}
              </For>
            </text>
          )}
        </For>
      </box>

      {/* Logo centré */}
      <box flexDirection="column" alignItems="center">
        <For each={selected}>
          {(line) => (
            <text fg={blue} attributes={TextAttributes.BOLD}>
              {line}
            </text>
          )}
        </For>
      </box>

      {/* Mention Made by AI-Studio */}
      <text fg={blue} attributes={TextAttributes.DIM} paddingTop={1}>
        Made by AI-Studio
      </text>
    </box>
  )
}
