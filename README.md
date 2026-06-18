# monopo saigon — harmonic interlude

> **창작의 벽을 허물어줄 화성 진행 추천기.**
> 코드와 분위기에 어울리는 감각적인 흐름을 발견해 보세요.

작곡가들이 곡을 쓸 때 특정 코드 이후에 어떤 화성을 배치해야 할지 막히는 창작의 벽(Writer's Block)을 해결하기 위한 웹 기반 화성 진행 추천 시스템입니다. 

사용자가 선택한 Key(조성)와 시작 코드, 그리고 원하는 곡의 분위기에 부합하는 최적의 4마디/8마디 화성 진행을 음악 이론 규칙 및 유명 대중음악 데이터베이스를 기반으로 제안합니다.

---

## 🎨 Design Reference
본 프로젝트는 **monopo saigon**의 시네마틱 editorial 아키텍처 디자인 시스템을 지향합니다:
- **올 다크 테마 (All-Dark Editorial Canvas)**: 깊은 몰입감을 주는 완전한 검은색 배경과 대비되는 선명한 하얀색 텍스트 배치.
- **Monumental Typography**: Neo-grotesque 인쇄 스타일의 극단적인 글자 크기 대비(`78px`에서 `180px` 규모의 헤드라인과 디테일한 미세 라벨).
- **Achromatic Discipline**: 유틸리티 요소를 제외한 모든 인터페이스 컬러를 모노크롬(무채색)으로 유지하고, 제너레이션된 3D 그래픽 아트웍을 백그라운드로 활용.
- **Curved Pills Only**: 카드와 입력창 등은 직각(`0px` border-radius)으로 구성하되, 버튼 및 태그 요소에만 극도의 `75px` 라운딩 처리 적용.

---

## ✨ Key Features
1. **순수음악이론규칙 추천 엔진 (Hybrid Recommendation)**
   - 12도 장조/단조 조성을 모두 분석하여 입력된 시작 코드를 로마자 분석(Roman Numeral Analysis)하여 기능화성학적으로 매칭.
   - **Tension -> Resolution** 흐름(Tonic $\rightarrow$ Subdominant $\rightarrow$ Dominant $\rightarrow$ Tonic)에 맞춘 다이내믹 그래프 알고리즘 탑재.
   - 유명 대중음악 진행 템플릿의 조옮김(Transposition) 및 로테이션 루프 매칭.
2. **다이내믹 2단 오선악보 (Grand Staff SVG)**
   - 추천되는 성부(Voicing)를 높은음자리표(Treble Clef)와 낮은음자리표(Bass Clef)에 분배하여 실시간 시각화.
   - 임시표(♭, ♯) 및 옥타브 이탈 시 덧줄(Ledger Lines)의 정확한 자동 연산 및 렌더링.
   - 외부 라이브러리 의존성 없이 클라이언트 단에서 SVG를 순수 제어하여 100% 오프라인 동작 보장.
3. **가상 건반 인터페이스 & 보이스 리딩 (Voice Leading)**
   - 클릭 및 화성 재생 시 3옥타브 가상 건반에 코드를 누르는 위치가 실시간 하이라이트.
   - 성부가 바뀔 때 음정이 멀리 도약하지 않고 매끄럽게 연결되도록 처리하는 자동 음성 유도(Voice Leading) 메커니즘.
4. **폴리포닉 합성기 (Web Audio API)**
   - 따뜻하고 명확한 피아노 음색 모델링.
   - 화성이 넘어갈 때 '탁탁' 튀는 팝 노이즈(Click)를 완벽히 제거하기 위한 미세 Attack/Release 선형 램프 적용.
5. **내보내기 & 복사 (MIDI Export & Copy)**
   - 텍스트 복사 및 다성부 MIDI 파일(`.mid` SMF Type 0)을 브라우저 바이트 연산으로 생성하여 다운로드. 시퀀서(DAW)에 즉시 드래그 앤 드롭 가능.

---

## 🚀 How to Run (Local)
본 프로젝트는 어떠한 외부 빌드 도구(Node, Python 등)나 서버 없이 **100% 순수 브라우저 클라이언트 단**에서 실행되도록 설계되었습니다.
1. 이 레포지토리를 다운로드(Clone)합니다.
2. 폴더 내의 `index.html` 파일을 더블 클릭하면 사용자의 기본 웹 브라우저(Chrome, Edge 등)에서 즉시 실행됩니다.

---

## 🛠️ Stack
- HTML5 (Semantic Structure)
- Vanilla CSS (Monopo Saigon Token system)
- Vanilla JavaScript (Web Audio API, MIDI Writer, Diatonic SVG staff rendering)
- Git & GitHub Pages (Hosting)
