// Music Theory Data and Chord Generation Logic

const ROOTS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const FLAT_MAP = { "Db": "C#", "D#": "Eb", "Gb": "F#", "G#": "Ab", "A#": "Bb" };

// Intervals relative to root for each chord type
const CHORD_FORMULAS = {
  "Major": [0, 4, 7],
  "minor": [0, 3, 7],
  "Diminished": [0, 3, 6],
  "Augmented": [0, 4, 8],
  "maj7": [0, 4, 7, 11],
  "m7": [0, 3, 7, 10],
  "7": [0, 4, 7, 10],
  "m7b5": [0, 3, 6, 10],
  "dim7": [0, 3, 6, 9],
  "maj9": [0, 4, 7, 11, 14],
  "m9": [0, 3, 7, 10, 14],
  "9": [0, 4, 7, 10, 14]
};

// Scale degrees for Major and Natural Minor scales
const SCALES = {
  major: {
    intervals: [0, 2, 4, 5, 7, 9, 11],
    chords: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
    defaultQualities: {
      "I": "Major", "ii": "minor", "iii": "minor", "IV": "Major",
      "V": "Major", "vi": "minor", "vii°": "Diminished"
    }
  },
  minor: {
    intervals: [0, 2, 3, 5, 7, 8, 10],
    chords: ["i", "ii°", "III", "iv", "v", "VI", "VII"],
    defaultQualities: {
      "i": "minor", "ii°": "Diminished", "III": "Major", "iv": "minor",
      "v": "minor", "VI": "Major", "VII": "Major"
    }
  }
};

// Map Roman Numerals to semitone offset and standard quality
function parseRoman(roman, keyType) {
  const isMajor = keyType === "major";
  const scaleInfo = SCALES[keyType];
  
  // Clean string
  let clean = roman.replace(/[7°]/g, "");
  
  // Specific flat chords (Modal interchange in major)
  if (isMajor) {
    if (clean === "bVI") return { offset: 8, defaultQuality: "Major" };
    if (clean === "bVII") return { offset: 10, defaultQuality: "Major" };
    if (clean === "iv") return { offset: 5, defaultQuality: "minor" };
  }
  
  // Minor key harmonic adjustments
  if (!isMajor) {
    if (clean === "V") return { offset: 7, defaultQuality: "Major" };
    if (clean === "V7") return { offset: 7, defaultQuality: "7" };
    if (clean === "vii°7") return { offset: 11, defaultQuality: "dim7" };
  }
  
  // Look up standard degree index
  const index = scaleInfo.chords.indexOf(clean);
  if (index !== -1) {
    const offset = scaleInfo.intervals[index];
    const defaultQuality = scaleInfo.defaultQualities[clean];
    return { offset, defaultQuality };
  }
  
  // Fallbacks
  return { offset: 0, defaultQuality: "Major" };
}

// Curated templates
const TEMPLATES = {
  major: [
    { name: "Classic Pop Loop", progression: ["I", "V", "vi", "IV"], description: "The most successful chord loop in pop history. Stable and uplifting." },
    { name: "Melancholic Rotation", progression: ["vi", "IV", "I", "V"], description: "Pop progression starting on the minor vi. Emotional and driving." },
    { name: "Plagal Ascent", progression: ["I", "IV", "vi", "V"], description: "An expansive, uplifting progression popular in stadium anthems." },
    { name: "Warm Neo-Soul", progression: ["I", "III", "vi", "IV"], description: "Uses a major III secondary dominant chord to create warm, jazzy tension." },
    { name: "Modal Melancholy", progression: ["I", "iv", "I", "IV"], description: "Borrows the minor iv chord from parallel minor. Dreamy and sentimental." },
    { name: "Epic Cinematic", progression: ["I", "bVI", "bVII", "I"], description: "Epic, cinematic build frequently used in trailers and rock ballads." },
    { name: "Smooth Jazz Turnaround", progression: ["I", "vi", "ii", "V"], description: "Standard jazz I-vi-ii-V cycle. Sophisticated and flowing." },
    { name: "Chromatic Line Cliché", progression: ["I", "Iaug", "IV", "iv"], description: "Beautiful moving chromatic voice line (5 -> #5 -> 6 -> b6)." },
    { name: "Suspended Dominant", progression: ["I", "Vaug", "vi", "IV"], description: "Uses a tense augmented V chord to resolve into the minor vi." }
  ],
  minor: [
    { name: "Minor Pop Flow", progression: ["i", "VI", "III", "VII"], description: "Modern, driving minor progression. Moody and hooky." },
    { name: "Melancholic Cadence", progression: ["i", "VII", "VI", "V"], description: "The classic Andalusian cadence. Spanish/classical, dark mood." },
    { name: "Cinematic Dark", progression: ["i", "VI", "VII", "i"], description: "Expansive, epic minor flow used in film scores and drama." },
    { name: "R&B Minor Loop", progression: ["i", "iv", "VI", "V"], description: "Smooth, emotional minor cycle with a strong dominant resolution." },
    { name: "Jazz Minor Turnaround", progression: ["ii°", "V", "i", "i"], description: "Standard minor jazz turnaround. Sophisticated and classical." },
    { name: "Line Cliché Suspense", progression: ["i", "i", "iv", "V"], description: "Suspenseful loop. The i chord is enriched with chromatic line movement." }
  ]
};

// Generative graph engine fallbacks
// Tonic (T) -> Subdominant (SD) -> Dominant (D) -> Tonic (T)
const FUNCTIONAL_GRAPH = {
  major: {
    "I": ["ii", "IV", "V", "vi", "bVI"],
    "ii": ["V", "vii°"],
    "iii": ["vi", "IV"],
    "IV": ["V", "ii", "iv", "bVII"],
    "V": ["I", "vi"],
    "vi": ["ii", "IV", "V"],
    "vii°": ["I", "vi"],
    "bVI": ["bVII", "V"],
    "bVII": ["I"],
    "iv": ["I", "V"]
  },
  minor: {
    "i": ["ii°", "iv", "VI", "VII", "V"],
    "ii°": ["V", "VII"],
    "III": ["VI", "iv"],
    "iv": ["V", "i", "ii°"],
    "v": ["i", "VI"],
    "V": ["i", "VI"],
    "VI": ["ii°", "iv", "VII", "V"],
    "VII": ["III", "i"]
  }
};

// Translate flat keys if inputted
function getRootIndex(rootName) {
  let name = FLAT_MAP[rootName] || rootName;
  return ROOTS.indexOf(name);
}

// Convert semitone offset and chord quality to detailed Chord Object
function generateChordObj(keyRootName, keyType, roman, mood) {
  const keyRootIdx = getRootIndex(keyRootName);
  const { offset, defaultQuality } = parseRoman(roman, keyType);
  
  // Calculate root pitch index (0-11)
  const chordRootIdx = (keyRootIdx + offset) % 12;
  const chordRootName = ROOTS[chordRootIdx];
  
  // Determine chord quality based on default quality and mood filter
  let quality = defaultQuality;
  
  if (mood === "jazz") {
    if (defaultQuality === "Major") quality = "maj7";
    else if (defaultQuality === "minor") quality = "m7";
    else if (defaultQuality === "7") quality = "9";
    else if (defaultQuality === "Diminished") quality = "m7b5";
  } else if (mood === "tense") {
    // Add augmented/diminished extensions where appropriate
    if (roman.includes("aug") || roman === "V") {
      quality = "Augmented";
    } else if (roman.includes("°") || roman === "ii" || roman === "vii") {
      quality = "dim7";
    }
  } else if (mood === "dark" && keyType === "major") {
    // Add modal interchange qualities
    if (roman === "IV") quality = "minor"; // borrow iv
  }

  // Fallback check
  if (!CHORD_FORMULAS[quality]) {
    quality = defaultQuality;
  }
  
  return {
    root: chordRootName,
    roman: roman,
    quality: quality,
    displayName: chordRootName + (
      quality === "Major" ? "" :
      quality === "minor" ? "m" :
      quality === "Diminished" ? "dim" :
      quality === "Augmented" ? "aug" :
      quality === "maj7" ? "maj7" :
      quality === "m7" ? "m7" :
      quality === "7" ? "7" :
      quality === "m7b5" ? "m7b5" :
      quality === "dim7" ? "dim7" :
      quality === "maj9" ? "maj9" :
      quality === "m9" ? "m9" : "9"
    )
  };
}

// Search and Generate progressions
function getProgressions(keyRoot, keyType, startChordRoman, mood) {
  const results = [];
  const templatesList = TEMPLATES[keyType];
  
  // 1. Process templates and search for matches
  templatesList.forEach(tpl => {
    let prog = tpl.progression;
    
    // Check if progression contains the starting chord
    const idx = prog.indexOf(startChordRoman);
    if (idx !== -1) {
      // Rotate the progression so it starts with the selected chord
      let rotated = [...prog];
      if (idx > 0) {
        rotated = [...prog.slice(idx), ...prog.slice(0, idx)];
      }
      
      const chords = rotated.map(r => generateChordObj(keyRoot, keyType, r, mood));
      results.push({
        name: tpl.name + (idx > 0 ? " (Rotated)" : ""),
        chords: chords,
        description: tpl.description,
        source: "template"
      });
    }
  });

  // 2. Generative Graph Fallback if we have fewer than 3 options
  if (results.length < 3) {
    const graph = FUNCTIONAL_GRAPH[keyType];
    let attempts = 0;
    
    // Generate up to 5 random walks starting at the starting chord
    while (results.length < 4 && attempts < 40) {
      attempts++;
      let walk = [startChordRoman];
      let current = startChordRoman;
      
      for (let i = 0; i < 3; i++) {
        const nextOptions = graph[current] || graph[current.replace(/[7°]/g, "")];
        if (nextOptions && nextOptions.length > 0) {
          const next = nextOptions[Math.floor(Math.random() * nextOptions.length)];
          walk.push(next);
          current = next;
        } else {
          // Break walk if no transitions
          break;
        }
      }
      
      if (walk.length === 4) {
        // Ensure no duplicate progressions already added
        const walkStr = walk.join("-");
        const exists = results.some(r => r.chords.map(c => c.roman).join("-") === walkStr);
        
        if (!exists) {
          const chords = walk.map(r => generateChordObj(keyRoot, keyType, r, mood));
          results.push({
            name: "Generative Harmonization " + (results.length - 1),
            chords: chords,
            description: "Dynamically generated flow based on functional harmony principles.",
            source: "generative"
          });
        }
      }
    }
  }

  return results.slice(0, 5); // Return up to 5 best options
}

// Spell the MIDI notes for a chord (with basic voice leading)
// firstChordVoicing is optional previous notes array for voice leading
function spellChordNotes(chordObj, prevVoicing = null) {
  const rootIdx = getRootIndex(chordObj.root);
  const formula = CHORD_FORMULAS[chordObj.quality] || CHORD_FORMULAS["Major"];
  
  // Bass note: Root note in Octave 3 (MIDI 48 to 59)
  const bassNote = 12 * 3 + rootIdx;
  
  // Right-hand notes: Play in Octave 4 and 5 (MIDI 60 to 83)
  let rightHandPitches = formula.map(semitone => {
    let pitch = 12 * 4 + rootIdx + semitone;
    // Keep it in clean keyboard range
    while (pitch >= 84) pitch -= 12;
    return pitch;
  });

  // Apply Voice Leading: Adjust right-hand octaves to stay close to the previous chord
  if (prevVoicing && prevVoicing.length > 1) {
    // Exclude bass note (the first note) of the previous voicing to get the previous right hand
    const prevRightHand = prevVoicing.slice(1);
    const prevAverage = prevRightHand.reduce((a, b) => a + b, 0) / prevRightHand.length;
    
    rightHandPitches = rightHandPitches.map(pitch => {
      // Find the octave displacement that minimizes distance to the previous average pitch
      let bestPitch = pitch;
      let minDiff = Math.abs(pitch - prevAverage);
      
      // Test 1 octave down
      if (Math.abs(pitch - 12 - prevAverage) < minDiff && pitch - 12 >= 55) {
        bestPitch = pitch - 12;
        minDiff = Math.abs(pitch - 12 - prevAverage);
      }
      // Test 1 octave up
      if (Math.abs(pitch + 12 - prevAverage) < minDiff && pitch + 12 <= 84) {
        bestPitch = pitch + 12;
      }
      return bestPitch;
    });
  }

  // Return full voicing: Bass note first, then sorted right hand notes
  rightHandPitches.sort((a, b) => a - b);
  return [bassNote, ...rightHandPitches];
}

// ----------------------------------------------------
// Web Audio API Synthesizer with FX
// ----------------------------------------------------

class AmbientSynth {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.activeVoices = [];
  }

  init() {
    if (this.ctx) return;
    
    // Create Audio Context
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // Master Gain Node
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.28, this.ctx.currentTime); // Standard clean master volume
    
    this.masterGain.connect(this.ctx.destination);
  }

  playChord(midiNotes, durationSec = 2.0) {
    this.init();
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    
    const now = this.ctx.currentTime;
    const voices = [];

    midiNotes.forEach((midiNumber, index) => {
      const freq = 440 * Math.pow(2, (midiNumber - 69) / 12);
      const isBass = index === 0;

      // Clean Standard Piano Timbre
      const oscBody = this.ctx.createOscillator();     // Fundamental piano tone
      const oscHarmonic = this.ctx.createOscillator(); // 1st Harmonic for brightness
      const oscStrike = this.ctx.createOscillator();   // Soft hammer strike
      
      oscBody.type = "triangle";
      oscBody.frequency.setValueAtTime(freq, now);
      
      oscHarmonic.type = "sine";
      oscHarmonic.frequency.setValueAtTime(freq * 2, now);
      
      oscStrike.type = "sine";
      oscStrike.frequency.setValueAtTime(freq * 3, now); // 3rd harmonic for hammer ping

      // No detune to keep notes perfectly clean and focused
      oscBody.detune.setValueAtTime(0, now);
      oscHarmonic.detune.setValueAtTime(0, now);

      // Clean Lowpass Filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      
      // Let more high frequencies pass for brightness, but decay it slightly
      const startCutoff = isBass ? 1200 : 2500;
      const endCutoff = isBass ? 400 : 800;
      filter.frequency.setValueAtTime(startCutoff, now);
      filter.frequency.exponentialRampToValueAtTime(endCutoff, now + 0.8);
      filter.Q.setValueAtTime(1.0, now);

      // Envelopes
      const mainGain = this.ctx.createGain();
      mainGain.gain.setValueAtTime(0, now);
      
      const strikeGain = this.ctx.createGain();
      strikeGain.gain.setValueAtTime(0, now);

      const attack = 0.015; // Smooth attack (15ms) to prevent note-on clicks
      const decay = 1.0;    // Dry piano decay
      const sustain = 0.15; // Low sustain level
      const release = 0.35; // Smooth release (350ms) to prevent note-off clicks
      
      const bodyVolume = isBass ? 0.35 : 0.24;
      const strikeVolume = isBass ? 0.08 : 0.15;

      // Main Note Envelope
      mainGain.gain.linearRampToValueAtTime(bodyVolume, now + attack);
      mainGain.gain.exponentialRampToValueAtTime(bodyVolume * sustain, now + attack + decay);
      
      // Hammer Strike Gain Envelope
      strikeGain.gain.linearRampToValueAtTime(strikeVolume, now + attack);
      strikeGain.gain.linearRampToValueAtTime(0.0, now + attack + 0.04);

      // Clean Release Envelope at stopTime (Linear ramp prevents clicks)
      const stopTime = now + durationSec;
      mainGain.gain.setValueAtTime(bodyVolume * sustain, stopTime);
      mainGain.gain.linearRampToValueAtTime(0.0, stopTime + release);

      // Connections (Direct to master - NO delay feedback muddying the chords)
      oscBody.connect(filter);
      oscHarmonic.connect(filter);
      filter.connect(mainGain);
      
      oscStrike.connect(strikeGain);

      mainGain.connect(this.masterGain);
      strikeGain.connect(this.masterGain);

      // Start & Stop
      oscBody.start(now);
      oscHarmonic.start(now);
      oscStrike.start(now);
      
      oscBody.stop(stopTime + release + 0.1);
      oscHarmonic.stop(stopTime + release + 0.1);
      oscStrike.stop(now + 0.1);

      voices.push({ oscBody, oscHarmonic, oscStrike, mainGain, strikeGain });
    });

    this.activeVoices.push(...voices);
    
    // Cleanup voices
    setTimeout(() => {
      this.activeVoices = this.activeVoices.filter(v => !voices.includes(v));
    }, (durationSec + 1.0) * 1000);
  }

  stopAll() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    this.activeVoices.forEach(voice => {
      try {
        voice.mainGain.gain.cancelScheduledValues(now);
        voice.mainGain.gain.setValueAtTime(voice.mainGain.gain.value, now);
        voice.mainGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        
        setTimeout(() => {
          voice.oscBody.stop();
          voice.oscHarmonic.stop();
          voice.oscStrike.stop();
        }, 150);
      } catch (e) {
        // Voice already stopped
      }
    });
    this.activeVoices = [];
  }
}

const synth = new AmbientSynth();

// ----------------------------------------------------
// Byte-level Standard MIDI File Exporter
// ----------------------------------------------------

// Convert number to MIDI variable length quantity bytes
function encodeVLQ(ticks) {
  let buffer = [];
  let bufferVal = ticks & 0x7F;
  ticks = ticks >> 7;
  buffer.push(bufferVal);
  while (ticks > 0) {
    bufferVal = (ticks & 0x7F) | 0x80;
    buffer.push(bufferVal);
    ticks = ticks >> 7;
  }
  return buffer.reverse();
}

function exportMIDIFile(progressionChords) {
  // standard ticks per beat = 96
  // each chord lasts 4 beats (1 bar) = 384 ticks
  const ticksPerChord = 384;
  const noteDurationTicks = 376; // Leave a tiny gap (8 ticks) so notes re-trigger nicely in DAW
  
  const events = [];
  
  progressionChords.forEach((chordObj, chordIdx) => {
    const notes = spellChordNotes(chordObj);
    const startTick = chordIdx * ticksPerChord;
    const endTick = startTick + noteDurationTicks;
    
    notes.forEach(note => {
      // Note On Event
      events.push({
        tick: startTick,
        type: 0x90, // Note On channel 0
        note: note,
        velocity: 85 // standard natural velocity
      });
      // Note Off Event
      events.push({
        tick: endTick,
        type: 0x80, // Note Off channel 0
        note: note,
        velocity: 64
      });
    });
  });

  // Sort events by tick absolute time. Note Offs (0x80) should occur BEFORE Note Ons (0x90) if ticks are identical.
  events.sort((a, b) => {
    if (a.tick === b.tick) {
      return a.type - b.type;
    }
    return a.tick - b.tick;
  });

  // Build the track event bytes list
  const trackBytes = [];
  let lastTick = 0;
  
  events.forEach(evt => {
    const delta = evt.tick - lastTick;
    lastTick = evt.tick;
    
    // Write delta time as VLQ
    trackBytes.push(...encodeVLQ(delta));
    
    // Write event status, note, and velocity
    trackBytes.push(evt.type, evt.note, evt.velocity);
  });

  // End of Track meta event: delta 0, status 0xFF, type 0x2F, length 0
  trackBytes.push(0x00, 0xFF, 0x2F, 0x00);

  // 1. MIDI Header Chunk (MThd)
  const headerBytes = [
    0x4D, 0x54, 0x68, 0x64, // ASCII "MThd"
    0x00, 0x00, 0x00, 0x06, // Header size = 6 bytes
    0x00, 0x00,             // Format 0 (Single Track)
    0x00, 0x01,             // Number of tracks = 1
    0x00, 0x60              // Division: 96 ticks per quarter note
  ];

  // 2. MIDI Track Chunk (MTrk)
  const trackHeaderBytes = [
    0x4D, 0x54, 0x72, 0x6B // ASCII "MTrk"
  ];
  
  // Track length as 32-bit big-endian integer
  const len = trackBytes.length;
  const trackLengthBytes = [
    (len >> 24) & 0xFF,
    (len >> 16) & 0xFF,
    (len >> 8) & 0xFF,
    len & 0xFF
  ];

  // Combine all bytes
  const midiBytes = new Uint8Array([
    ...headerBytes,
    ...trackHeaderBytes,
    ...trackLengthBytes,
    ...trackBytes
  ]);

  return midiBytes;
}

// Trigger browser download of MIDI file
function triggerMIDIDownload(chordProgressions, filename = "progression.mid") {
  const bytes = exportMIDIFile(chordProgressions);
  const blob = new Blob([bytes], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// ----------------------------------------------------
// SVG Music Notation Staff Renderer
// ----------------------------------------------------

function getDiatonicStep(midi) {
  const semitonesFromC4 = midi - 60;
  const octaveOffset = Math.floor(semitonesFromC4 / 12);
  const pitchClass = ((semitonesFromC4 % 12) + 12) % 12;
  
  // Diatonic steps inside a single octave (0 to 6)
  const octaveSteps = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
  return octaveOffset * 7 + octaveSteps[pitchClass];
}

function drawStaffSVG(chords, keyRoot) {
  // Determine accidental style (sharp vs flat)
  const isFlatKey = ["F", "Bb", "Eb", "Ab", "Db", "Gb", "Fm", "Bbm", "Ebm", "Abm"].some(k => keyRoot.startsWith(k));
  const accidentalChar = isFlatKey ? "♭" : "♯";
  
  const svgWidth = 600;
  const svgHeight = 135;
  
  // Y coordinates of treble & bass staff lines
  const trebleLines = [20, 28, 36, 44, 52];
  const bassLines = [80, 88, 96, 104, 112];
  
  let svg = `<svg width="100%" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" class="music-staff" xmlns="http://www.w3.org/2000/svg" style="color: var(--color-paper-white);">`;
  
  // Draw staff lines
  trebleLines.forEach(y => {
    svg += `<line x1="10" y1="${y}" x2="${svgWidth - 10}" y2="${y}" stroke="currentColor" stroke-width="0.8" opacity="0.4"/>`;
  });
  bassLines.forEach(y => {
    svg += `<line x1="10" y1="${y}" x2="${svgWidth - 10}" y2="${y}" stroke="currentColor" stroke-width="0.8" opacity="0.4"/>`;
  });
  
  // Left system brace and vertical start barline
  svg += `<path d="M 10,20 L 10,112 M 10,20 C 5,20 5,66 10,66 C 5,66 5,112 10,112" fill="none" stroke="currentColor" stroke-width="1.8"/>`;
  svg += `<line x1="10" y1="20" x2="10" y2="112" stroke="currentColor" stroke-width="1.2"/>`;
  
  // Stylized minimalist Treble Clef
  svg += `
    <g stroke="currentColor" stroke-width="1.3" fill="none" opacity="0.8">
      <path d="M 28,62 C 28,64 26,65 25,65 C 23.5,65 23,63.5 23,62 C 23,59 28,50 28,34 C 28,24 23,12 25,12 C 26,12 28,15 28,20 M 28,20 C 24,24 20,32 20,38 C 20,44 24,48 28,48 C 32,48 35,44 35,38 C 35,30 29,24 24,24 C 21,24 18,27 18,31 C 18,34 20,36 22,36 C 24,36 25,34 25,32" />
    </g>
  `;
  
  // Stylized minimalist Bass Clef
  svg += `
    <g stroke="currentColor" fill="none" stroke-width="1.3" opacity="0.8">
      <path d="M 22,86 C 22,81 29,80 29,86 C 29,91 21,98 21,98" />
      <circle cx="33" cy="83" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="33" cy="91" r="1.5" fill="currentColor" stroke="none" />
    </g>
  `;
  
  // Measure barlines (split staff into 4 measures)
  const measureWidth = 130;
  const startX = 65;
  for (let i = 0; i <= 4; i++) {
    const x = startX + i * measureWidth;
    svg += `<line x1="${x}" y1="20" x2="${x}" y2="112" stroke="currentColor" stroke-width="0.8" opacity="0.5"/>`;
  }
  
  // Render notes for each chord in the progression
  chords.forEach((chordObj, chordIdx) => {
    const notes = spellChordNotes(chordObj);
    const x = startX + chordIdx * measureWidth + (measureWidth / 2);
    
    const trebleLedgers = new Set();
    const bassLedgers = new Set();
    
    notes.forEach((midi, noteIdx) => {
      const step = getDiatonicStep(midi);
      
      let y;
      if (midi < 60) {
        y = 72 - 4 * step;
      } else {
        y = 60 - 4 * step;
      }
      
      // Accidentals check (draw sharp/flat if semitones do not match standard scale degrees)
      const pc = midi % 12;
      const isAccidental = [1, 3, 6, 8, 10].includes(pc);
      
      if (isAccidental) {
        svg += `<text x="${x - 14}" y="${y + 4.5}" font-family="sans-serif" font-size="12" font-weight="bold" fill="currentColor" opacity="0.9">${accidentalChar}</text>`;
      }
      
      // Draw Note Head (Tilted Ellipse)
      svg += `<ellipse cx="${x}" cy="${y}" rx="5.5" ry="4" transform="rotate(-18, ${x}, ${y})" fill="currentColor" opacity="0.9"/>`;
      
      // Draw dynamic ledger lines
      if (midi >= 60) {
        // Treble staff ledger lines
        if (step <= 0) {
          for (let s = 0; s >= step; s -= 2) {
            const ly = 60 - 4 * s;
            if (!trebleLedgers.has(ly)) {
              svg += `<line x1="${x - 9}" y1="${ly}" x2="${x + 9}" y2="${ly}" stroke="currentColor" stroke-width="1.0" opacity="0.8"/>`;
              trebleLedgers.add(ly);
            }
          }
        } else if (step >= 12) {
          for (let s = 12; s <= step; s += 2) {
            const ly = 60 - 4 * s;
            if (!trebleLedgers.has(ly)) {
              svg += `<line x1="${x - 9}" y1="${ly}" x2="${x + 9}" y2="${ly}" stroke="currentColor" stroke-width="1.0" opacity="0.8"/>`;
              trebleLedgers.add(ly);
            }
          }
        }
      } else {
        // Bass staff ledger lines
        if (step >= 0) {
          for (let s = 0; s <= step; s += 2) {
            const ly = 72 - 4 * s;
            if (!bassLedgers.has(ly)) {
              svg += `<line x1="${x - 9}" y1="${ly}" x2="${x + 9}" y2="${ly}" stroke="currentColor" stroke-width="1.0" opacity="0.8"/>`;
              bassLedgers.add(ly);
            }
          }
        } else if (step <= -10) {
          for (let s = -10; s >= step; s -= 2) {
            const ly = 72 - 4 * s;
            if (!bassLedgers.has(ly)) {
              svg += `<line x1="${x - 9}" y1="${ly}" x2="${x + 9}" y2="${ly}" stroke="currentColor" stroke-width="1.0" opacity="0.8"/>`;
              bassLedgers.add(ly);
            }
          }
        }
      }
    });
  });
  
  svg += `</svg>`;
  return svg;
}

// ----------------------------------------------------
// UI Logic & Event Handlers
// ----------------------------------------------------

let currentProgressions = [];
let playbackIntervalId = null;
let currentPlayingCardIdx = null;
let currentPlayingChordIdx = null;

// Map MIDI note numbers to visual key names (3 octaves, starting at C3 = 48)
const KEY_MAP_VISUAL = [
  { midi: 48, name: "C3", isBlack: false },
  { midi: 49, name: "C#3", isBlack: true },
  { midi: 50, name: "D3", isBlack: false },
  { midi: 51, name: "D#3", isBlack: true },
  { midi: 52, name: "E3", isBlack: false },
  { midi: 53, name: "F3", isBlack: false },
  { midi: 54, name: "F#3", isBlack: true },
  { midi: 55, name: "G3", isBlack: false },
  { midi: 56, name: "G#3", isBlack: true },
  { midi: 57, name: "A3", isBlack: false },
  { midi: 58, name: "A#3", isBlack: true },
  { midi: 59, name: "B3", isBlack: false },
  
  { midi: 60, name: "C4", isBlack: false },
  { midi: 61, name: "C#4", isBlack: true },
  { midi: 62, name: "D4", isBlack: false },
  { midi: 63, name: "D#4", isBlack: true },
  { midi: 64, name: "E4", isBlack: false },
  { midi: 65, name: "F4", isBlack: false },
  { midi: 66, name: "F#4", isBlack: true },
  { midi: 67, name: "G4", isBlack: false },
  { midi: 68, name: "G#4", isBlack: true },
  { midi: 69, name: "A4", isBlack: false },
  { midi: 70, name: "A#4", isBlack: true },
  { midi: 71, name: "B4", isBlack: false },
  
  { midi: 72, name: "C5", isBlack: false },
  { midi: 73, name: "C#5", isBlack: true },
  { midi: 74, name: "D5", isBlack: false },
  { midi: 75, name: "D#5", isBlack: true },
  { midi: 76, name: "E5", isBlack: false },
  { midi: 77, name: "F5", isBlack: false },
  { midi: 78, name: "F#5", isBlack: true },
  { midi: 79, name: "G5", isBlack: false },
  { midi: 80, name: "G#5", isBlack: true },
  { midi: 81, name: "A5", isBlack: false },
  { midi: 82, name: "A#5", isBlack: true },
  { midi: 83, name: "B5", isBlack: false },
  { midi: 84, name: "C6", isBlack: false } // extra white key for symmetry
];

// Highlight piano keyboard keys based on chord pitches
function highlightKeyboard(notes, rootMidi = null) {
  // Clear existing highlights
  document.querySelectorAll(".piano-key").forEach(key => {
    key.classList.remove("active-note", "active-root");
  });

  notes.forEach(note => {
    const keyEl = document.querySelector(`.piano-key[data-midi="${note}"]`);
    if (keyEl) {
      if (note === rootMidi) {
        keyEl.classList.add("active-root");
      } else {
        keyEl.classList.add("active-note");
      }
    }
  });
}

// Render the visual piano keyboard
function buildKeyboard() {
  const keyboardEl = document.getElementById("piano-keyboard-container");
  if (!keyboardEl) return;
  
  keyboardEl.innerHTML = "";
  
  KEY_MAP_VISUAL.forEach(keyInfo => {
    const key = document.createElement("div");
    key.classList.add("piano-key", keyInfo.isBlack ? "black" : "white");
    key.setAttribute("data-midi", keyInfo.midi);
    key.setAttribute("id", `piano-key-${keyInfo.midi}`);
    
    // Label white keys with pitch name
    if (!keyInfo.isBlack) {
      key.textContent = keyInfo.name;
    }
    
    // Visual trigger when clicking keyboard keys directly
    key.addEventListener("mousedown", () => {
      synth.playChord([keyInfo.midi], 1.0);
      highlightKeyboard([keyInfo.midi], keyInfo.midi);
    });
    
    keyboardEl.appendChild(key);
  });
}

// Show temporary feedback toast
function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  
  const toast = document.createElement("div");
  toast.className = "toast show";
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Format progression for copy
function copyProgressionText(chords) {
  const text = chords.map(c => c.displayName).join(" - ");
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Copied to clipboard: ${text}`);
  }).catch(() => {
    showToast("Failed to copy chord text.");
  });
}

// Stop current loop playback
function stopLoop() {
  if (playbackIntervalId) {
    clearInterval(playbackIntervalId);
    playbackIntervalId = null;
  }
  synth.stopAll();
  currentPlayingCardIdx = null;
  currentPlayingChordIdx = null;
  
  // Clear visual loops
  document.querySelectorAll(".chord-block").forEach(b => b.classList.remove("playing"));
  document.querySelectorAll(".btn-listen-toggle").forEach(btn => {
    btn.textContent = "Listen";
    btn.classList.remove("btn-pill-utility");
    btn.classList.add("btn-pill-outline");
  });
  
  // Clear piano keys
  document.querySelectorAll(".piano-key").forEach(key => {
    key.classList.remove("active-note", "active-root");
  });
}

// Play progression in looping 4-bar rhythm
function toggleProgressionLoop(cardIdx, chords, listenButton) {
  if (currentPlayingCardIdx === cardIdx) {
    // If playing this exact card, stop it
    stopLoop();
    return;
  }
  
  // Stop any previous running loops
  stopLoop();
  
  // Active playing card indicator
  currentPlayingCardIdx = cardIdx;
  currentPlayingChordIdx = 0;
  listenButton.textContent = "Stop";
  listenButton.classList.remove("btn-pill-outline");
  listenButton.classList.add("btn-pill-utility");

  // Show loading anim spinner triggers
  const loading = document.getElementById("audio-loader");
  loading.classList.add("active");
  setTimeout(() => {
    loading.classList.remove("active");
  }, 400);

  // Core loop step
  const cardEl = document.getElementById(`progression-card-${cardIdx}`);
  const chordBlocks = cardEl.querySelectorAll(".chord-block");
  
  let prevVoicing = null;

  function playStep() {
    chordBlocks.forEach(b => b.classList.remove("playing"));
    
    const blockEl = chordBlocks[currentPlayingChordIdx];
    blockEl.classList.add("playing");
    
    const chordObj = chords[currentPlayingChordIdx];
    const voicing = spellChordNotes(chordObj, prevVoicing);
    
    // Play synthesizer
    synth.playChord(voicing, 2.0);
    
    // Highlight piano visualizer
    const rootIdx = getRootIndex(chordObj.root);
    // Find octave 4 root MIDI pitch
    let rootMidi = 12 * 4 + rootIdx;
    highlightKeyboard(voicing, rootMidi);
    
    // Keep reference for voice leading in next step
    prevVoicing = voicing;
    
    // Increment step
    currentPlayingChordIdx = (currentPlayingChordIdx + 1) % chords.length;
  }

  // Play immediately
  playStep();
  
  // Schedule 2-second rhythm interval
  playbackIntervalId = setInterval(playStep, 2000);
}

// Generate recommendations and re-render UI list
function renderRecommendations() {
  stopLoop();
  
  const keyRoot = document.getElementById("key-root-select").value;
  const keyType = document.getElementById("key-type-select").value;
  const startChordRoman = document.getElementById("start-chord-select").value;
  const mood = document.querySelector(".btn-option.active").getAttribute("data-mood");
  
  const listEl = document.getElementById("progression-list-container");
  if (!listEl) return;
  
  // Run Recommendation algorithm
  currentProgressions = getProgressions(keyRoot, keyType, startChordRoman, mood);
  
  listEl.innerHTML = "";
  document.getElementById("results-count-display").textContent = `${currentProgressions.length} progressions generated`;
  
  if (currentProgressions.length === 0) {
    listEl.innerHTML = `
      <div style="border: 1px solid var(--color-smoke); padding: 40px; text-align: center; color: var(--color-ash);">
        <p style="font-weight: 600; margin-bottom: 8px;">No suitable progression path found.</p>
        <p style="font-size: 13px;">No recommendations match this chord in database. Try changing to a basic triad (I, ii, vi, etc.) or change the Key/Mood.</p>
      </div>
    `;
    return;
  }
  
  currentProgressions.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "progression-card";
    card.setAttribute("id", `progression-card-${idx}`);
    
    // Spell chords row
    let blocksHtml = "";
    item.chords.forEach((chord, chordIdx) => {
      blocksHtml += `
        <div class="chord-block" data-chord-idx="${chordIdx}">
          <div class="play-indicator"></div>
          <div class="chord-name">${chord.displayName}</div>
          <div class="chord-numeral">${chord.roman}</div>
        </div>
      `;
    });
    
    card.innerHTML = `
      <div class="card-header">
        <div>
          <h3 style="font-size: 18px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">${item.name}</h3>
          <p style="font-size: 13px; color: var(--color-ash); line-height: 1.4; max-width: 600px;">${item.description}</p>
        </div>
        <div class="progression-meta">
          <span class="progression-tag">${item.source}</span>
        </div>
      </div>
      
      <div class="chord-blocks-row">
        ${blocksHtml}
      </div>
      
      <div class="staff-container" id="staff-card-${idx}" style="margin-top: var(--spacing-28); border-top: 1px dashed var(--color-ash); padding-top: var(--spacing-12); display: flex; justify-content: center; overflow-x: auto; user-select: none;">
        <!-- SVG will be injected here -->
      </div>
      
      <div class="card-actions">
        <button id="btn-listen-${idx}" class="btn-pill btn-pill-small btn-pill-outline btn-listen-toggle">Listen</button>
        <button id="btn-copy-${idx}" class="btn-pill btn-pill-small btn-pill-outline">Copy Text</button>
        <button id="btn-midi-${idx}" class="btn-pill btn-pill-small btn-pill-utility">Export MIDI</button>
      </div>
    `;
    
    // Add Event Listeners for actions
    const listenBtn = card.querySelector(`#btn-listen-${idx}`);
    listenBtn.addEventListener("click", () => {
      toggleProgressionLoop(idx, item.chords, listenBtn);
    });
    
    card.querySelector(`#btn-copy-${idx}`).addEventListener("click", () => {
      copyProgressionText(item.chords);
    });
    
    card.querySelector(`#btn-midi-${idx}`).addEventListener("click", () => {
      triggerMIDIDownload(item.chords, `${item.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.mid`);
    });
    
    // Direct chord block click playback
    card.querySelectorAll(".chord-block").forEach((block, chordIdx) => {
      block.addEventListener("click", () => {
        const chordObj = item.chords[chordIdx];
        const voicing = spellChordNotes(chordObj);
        synth.playChord(voicing, 1.5);
        highlightKeyboard(voicing, 12 * 4 + getRootIndex(chordObj.root));
      });
    });
    
    listEl.appendChild(card);
    
    // Inject dynamic 4-measure sheet music staff SVG
    const staffEl = card.querySelector(`#staff-card-${idx}`);
    if (staffEl) {
      staffEl.innerHTML = drawStaffSVG(item.chords, keyRoot);
    }
  });
}

// Update starting chord dropdown options based on Key type (Major vs Minor)
function updateStartChordOptions() {
  const typeSelect = document.getElementById("key-type-select").value;
  const chordSelect = document.getElementById("start-chord-select");
  if (!chordSelect) return;
  
  chordSelect.innerHTML = "";
  
  const chords = SCALES[typeSelect].chords;
  
  chords.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    chordSelect.appendChild(opt);
  });
  
  // Add common secondary dominant and modal interchange options as input extension
  if (typeSelect === "major") {
    // Add minor iv, flat-VI, flat-VII options
    const extra = ["iv", "bVI", "bVII"];
    extra.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c + " (Borrowed)";
      chordSelect.appendChild(opt);
    });
  } else {
    // Add major V harmonic dominant option
    const opt = document.createElement("option");
    opt.value = "V";
    opt.textContent = "V (Harmonic Major)";
    chordSelect.appendChild(opt);
  }
}

// Initialize application on DOM load
document.addEventListener("DOMContentLoaded", () => {
  // Build 3-octave virtual keyboard
  buildKeyboard();
  
  // Setup starting chords
  updateStartChordOptions();
  
  // Initialize recommendation cards
  renderRecommendations();
  
  // Setup Input triggers
  document.getElementById("key-root-select").addEventListener("change", renderRecommendations);
  
  document.getElementById("key-type-select").addEventListener("change", () => {
    updateStartChordOptions();
    renderRecommendations();
  });
  
  document.getElementById("start-chord-select").addEventListener("change", renderRecommendations);
  
  // Mood option button triggers
  document.querySelectorAll(".btn-option").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-option").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderRecommendations();
    });
  });
  
  // Navbar scroll background trigger
  window.addEventListener("scroll", () => {
    const nav = document.getElementById("main-nav");
    if (window.scrollY > 50) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }
  });
  
  // Smooth scroll explore trigger
  const exploreBtn = document.getElementById("explore-trigger");
  if (exploreBtn) {
    exploreBtn.addEventListener("click", () => {
      document.getElementById("editorial-content").scrollIntoView({ behavior: "smooth" });
    });
  }
  
  // Cookie banner trigger
  const cookieBanner = document.getElementById("cookie-consent-banner");
  const cookieBtn = document.getElementById("cookie-accept-btn");
  
  // Delay cookie banner pop-in
  setTimeout(() => {
    cookieBanner.classList.add("show");
  }, 1500);
  
  cookieBtn.addEventListener("click", () => {
    cookieBanner.classList.remove("show");
    showToast("Cookie preferences updated.");
  });
});
