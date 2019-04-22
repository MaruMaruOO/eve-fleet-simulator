// @flow
import React from 'react';
import { Accordion, Container, Segment, Header } from 'semantic-ui-react';

const faqAnswer0 = 'Eve Fleet Simulator is a tool to help analyze player versus player fleet combat and ships for Eve Online.';

const faqAnswer1 = (
  <div>
    It simulates the behavior of opposing fleets of ships controlled by real players.<br />
    It also allows for robust sorting and comparison for ships and ship fits.
  </div>
);

const faqAnswer2 = (
  <div>
    Creating new fleet doctrines, or tweaking existing ones.<br />
    Comparing the PvP effectiveness of different doctrines or compositions.<br />
    Determining the expected result of a potential engagement.<br />
    Easily and accurately working out the time required for ganks.<br />
    Determining the engagement range and profile of a fleet.<br />
    Helping to select and compare hull options for both PvP and PvE.<br />
    Answering novel questions like which X can fit the biggest armor
    tank or has the highest missile damage.
  </div>
);

const faqAnswer3 = (
  <div>
    A perfect simulation of PvP fleet combat would require a re-implementation of Eve&apos;s
    entire combat system along with AI that perfectly matches actual player actions.<br />
    It would also still have to run at least a thousand times faster than the actual game.<br />
    With this in mind Eve Fleet Simulator is a partial implementation with an
    ongoing effort to more closely match in game behavior.<br />
    A list of mechanics and behaviors that have yet to be implemented can be
    found <a href="https://github.com/MaruMaruOO/eve-fleet-simulator/blob/master/resources/Limitations.md">here</a>.
  </div>
);

const faqAnswer4 = (
  <div>
    This indicates that the ship includes a corresponding module
    but EFS does not yet implement it&apos;s effects.<br />
    The fits details will include the module regardless but it can be helpful to know at a glance
    that a fit has nuets or a MJD, even if EFS doesn&apos;t yet simulate it&apos;s impact.<br />
    For more implementation information please see the
    <a href="https://github.com/MaruMaruOO/eve-fleet-simulator/blob/master/resources/Limitations.md"> list of known limitations </a>
    and the answer to &quot;What are Eve Fleet Simulator&apos;s limitations?&quot;.
  </div>
);

const faqAnswer5 = (
  <div>
    A quickstart guide can be found
    <a href="https://github.com/MaruMaruOO/eve-fleet-simulator/blob/master/resources/QUICKSTART.md"> here </a>
    and the readme is located
    <a href="https://github.com/MaruMaruOO/eve-fleet-simulator/blob/master/README.md"> here</a>.
  </div>
);

const faqAnswer6 = (
  <div>
    Make sure you check the
    <a href="https://github.com/MaruMaruOO/eve-fleet-simulator/blob/master/README.md"> readme</a>,
    <a href="https://github.com/MaruMaruOO/eve-fleet-simulator/blob/master/resources/QUICKSTART.md"> quickstart guide </a>
    and
    <a href="https://github.com/MaruMaruOO/eve-fleet-simulator/blob/master/resources/Limitations.md"> List of known limitations</a>.<br />
    If your question is still unanswered consider
    <a href="https://github.com/MaruMaruOO/eve-fleet-simulator/issues"> opening a github issue </a>
    if it&apos;s a bug or contacting the developer so it can be added to the FAQ or documentation.
  </div>
);

const faqAnswer7 = (
  <div>
    Imported fits are saved just for you.
    Specifically they are stored in your browsers local storage.
  </div>
);

const faqAnswer8 = (
  <div>
    The AI doesn&apos;t swap off targets at this time.
    In order to change target priories you can either drag table rows or type it in.
  </div>
);

const faqAnswer9 = (
  <div>
    No, to avoid giving one side an advantage EFS sequences actions
    so the side doesn&apos;t impact the outcome.<br />
    For example a tick will apply both sides weapons before either side removes loses.<br />
    Similarly ships will move based off where the opposing ships were in the previous tick.<br />
    This doesn&apos;t cause meaningful inaccuracies because EFS uses 50ms ticks
    that are shorter than most players pings to the server.
  </div>
);

const faqAnswer10 = (
  <div>
    Yes, you can see most upcoming plans by looking at the
    <a href="https://github.com/MaruMaruOO/eve-fleet-simulator/issues"> GitHub issues page</a>.<br />
    You can also leave comments or post suggestions there.
  </div>
);

const faqAnswer11 = (
  <div>
    Take a look at the
    <a
      href="https://github.com/MaruMaruOO/eve-fleet-simulator/blob/master/resources/Limitations.md"
    > list of known limitations
    </a>.<br />
    If your query isn&apos;t impacted by anything listed then
    the implementation should match the game.<br />
    If it doesn&apos;t seem to match the list or game please open an
    <a href="https://github.com/MaruMaruOO/eve-fleet-simulator/issues"> issue on GitHub </a>so it can be fixed.
  </div>
);

const faqAnswer12 = (
  <div>
    Yes, in order to accommodate the Eve player base
    both these numbers are actually text boxes.<br />
    So press/click the number and type in that nice round figure.
  </div>
);

const faqAnswer13 = (
  <div>
    EFS uses it&apos;s own data format for imports,
    you can&apos;t export fits from zkill or the like.<br />
    You must export fits from pyfa using the EFS format
    (Edit &rArr; To Clipboard &rArr; EFS &rArr; OK).<br />
    If you&apos;re doing this, pyfa is up to date and
    you still get the error, please report it as a bug.
  </div>
);

const faqAnswer14 = (
  <div>
    Each fit will position independently, selecting
    it&apos;s own anchor and following it around.<br />
    Ships will try to follow their anchor but opposing tackle
    can cause them to get separated and fall behind.<br />
    For specifics see the answer to
    &quot;How does the AI determine at what range it wants to be at?&quot;.
  </div>
);

const faqAnswer15 = (
  <div>
    Ships with remote repair start locking as soon as a friendly takes damage.<br />
    After that they cycle the repairs, repairing at the
    start of the cycle for shields or the end for armor/hull.
    Target resistance is factored into the repair.<br />
    Repair scaling uses an approximate formula that should always be within 5%.
    In practice it&apos;s typically much closer, especially at large scales.<br />
    There&apos;s also a system in place to avoid massively
    over repairing and having the target die between cycles.
  </div>
);

const faqAnswer16 = (
  <div>
    Each fit tests to find it&apos;s ideal range every 10 simulated seconds.<br />
    Logi tries to take as little damage as possible while staying in repair range.<br />
    Support ships try and take as little damage as possible while also applying their ewar.
    If required support ships will also unanchor in order to keep applying ewar to their target/s.
    It&apos;s particularly common to see this when they are trying
    to spread scrams across the opposing fleet.<br />
    Damage dealers and other ships try to keep
    <code> damage done / damage taken</code> as high as possible.
    They will also prioritize keeping application over 30% if possible,
    so they won&apos;t shoot from deep falloff just because the ratio is higher.
  </div>
);

const faqAnswer17 = (
  <div>
    Make sure your phone is in landscape mode when browsing the EFS website on mobile.<br />
    A portrait mode is planned but for now landscape should hopefully work fairly well.<br />
    Mobile apps are possible if the demand is there but they are basically just a
    wrapper around a local copy of the website.
  </div>
);

const faq = [
  {
    key: 'faq0',
    title: 'What is Eve Fleet Simulator?',
    content: { content: faqAnswer0, key: 'faqAnswer0' },
  },
  {
    key: 'faq1',
    title: 'What does Eve Fleet Simulator do?',
    content: { content: faqAnswer1, key: 'faqAnswer1' },
  },
  {
    key: 'faq2',
    title: 'What is Eve Fleet Simulator for?',
    content: { content: faqAnswer2, key: 'faqAnswer2' },
  },
  {
    key: 'faq3',
    title: 'What are Eve Fleet Simulator\'s limitations?',
    content: { content: faqAnswer3, key: 'faqAnswer3' },
  },
  {
    key: 'faq4',
    title: 'Why do some fits have faded module/effect icons?',
    content: { content: faqAnswer4, key: 'faqAnswer4' },
  },
  {
    key: 'faq5',
    title: 'How do I get started?',
    content: { content: faqAnswer5, key: 'faqAnswer5' },
  },
  {
    key: 'faq7',
    title: 'Are imported fits on the website saved for everyone or only for me?',
    content: { content: faqAnswer7, key: 'faqAnswer7' },
  },
  {
    key: 'faq8',
    title: 'I got into some weird deadlock situations where both fleet\'s targets caught reps and they refused to switch.',
    content: { content: faqAnswer8, key: 'faqAnswer8' },
  },
  {
    key: 'faq9',
    title: 'Why do identical fleets perfectly wipe each other out, shouldn\'t the side that goes first win?',
    content: { content: faqAnswer9, key: 'faqAnswer9' },
  },
  {
    key: 'faq12',
    title: 'Can I set a specific number for range or replay speed?',
    content: { content: faqAnswer12, key: 'faqAnswer12' },
  },
  {
    key: 'faq13',
    title: 'When I tried to import a fit I got "Unable to parse fit information".',
    content: { content: faqAnswer13, key: 'faqAnswer13' },
  },
  {
    key: 'faq14',
    title: 'How do anchors and positioning work?',
    content: { content: faqAnswer14, key: 'faqAnswer14' },
  },
  {
    key: 'faq15',
    title: 'How do remote repairs work?',
    content: { content: faqAnswer15, key: 'faqAnswer15' },
  },
  {
    key: 'faq16',
    title: 'How does the AI determine at what range it wants to be at?',
    content: { content: faqAnswer16, key: 'faqAnswer16' },
  },
  {
    key: 'faq11',
    title: 'Does EFS simulate or handle X?',
    content: { content: faqAnswer11, key: 'faqAnswer11' },
  },
  {
    key: 'faq17',
    title: 'Are you planning a mobile version for this?',
    content: { content: faqAnswer17, key: 'faqAnswer17' },
  },
  {
    key: 'faq10',
    title: 'Any future plans on expanding this?',
    content: { content: faqAnswer10, key: 'faqAnswer10' },
  },
  {
    key: 'faq6',
    title: 'I have another question.',
    content: { content: faqAnswer6, key: 'faqAnswer6' },
  },
];

function AboutPage() {
  return (
    <div className="pageMainContentWrapper">
      <Container className="pageContainer">
        <Header as="h5" attached="top">
          FAQ
        </Header>
        <Accordion panels={faq} styled fluid className="attached" />
        <Header as="h5" attached="top">
          Contact
        </Header>
        <Segment attached>
          Bug reporting and feature requests should be done via the
          <a href="https://github.com/MaruMaruOO/eve-fleet-simulator"> projects github page</a>.
          The developers can also be reached by sending emails to evefleetsim@gmail.com.
        </Segment>
        <Header as="h5" attached="top">
          License
        </Header>
        <Segment attached>
          Eve Fleet Simulator is released under the
          <a href="https://github.com/MaruMaruOO/eve-fleet-simulator/blob/master/LICENSE" type="license"> GNU Affero GPL license </a>
          and it&apos;s
          <a href="https://github.com/MaruMaruOO/eve-fleet-simulator"> source is available here</a>.
        </Segment>
        <Header as="h5" attached="top">
          CCP Copyright Notice
        </Header>
        <Segment attached>
          EVE Online and the EVE logo are the registered trademarks of CCP hf.
          All rights are reserved worldwide. All other trademarks are the property of their
          respective owners. EVE Online, the EVE logo, EVE and all associated logos and
          designs are the intellectual property of CCP hf. All artwork, screenshots,
          characters, vehicles, storylines, world facts or other recognizable features
          of the intellectual property relating to these trademarks are likewise the
          intellectual property of CCP hf. CCP hf. has granted permission to Eve Fleet Simulator
          to use EVE Online and all associated logos and designs for promotional and
          information purposes on its website but does not endorse, and is not in any
          way affiliated with, Eve Fleet Simulator.
          CCP is in no way responsible for the content on or functioning of this
          website, nor can it be liable for any damage arising from the use of this website.
        </Segment>
      </Container>
    </div>
  );
}

export default AboutPage;
