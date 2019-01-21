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
    found <a href="https://www.github.com/MaruMaruOO/eve-fleet-simulator/blob/master/resources/Limitations.md">here</a>.
  </div>
);

const faqAnswer4 = (
  <div>
    This indicates that the ship includes a corresponding module
    but EFS does not yet implement it&apos;s effects.<br />
    The fits details will include the module regardless but it can be helpful to know at a glance
    that a fit has nuets or a MJD, even if EFS doesn&apos;t yet simulate it&apos;s impact.<br />
    For more implementation information please see the
    <a href="https://www.github.com/MaruMaruOO/eve-fleet-simulator/blob/master/resources/Limitations.md"> list of known limitations </a>
    and the answer to &quot;What are Eve Fleet Simulator&apos;s limitations?&quot;.
  </div>
);

const faqAnswer5 = (
  <div>
    A quickstart guide can be found
    <a href="https://www.github.com/MaruMaruOO/eve-fleet-simulator/blob/master/resources/QUICKSTART.md"> here </a>
    and the readme is located
    <a href="https://www.github.com/MaruMaruOO/eve-fleet-simulator/blob/master/README.md"> here</a>.
  </div>
);

const faqAnswer6 = (
  <div>
    Make sure you check the
    <a href="https://www.github.com/MaruMaruOO/eve-fleet-simulator/blob/master/README.md"> readme</a>,
    <a href="https://www.github.com/MaruMaruOO/eve-fleet-simulator/blob/master/resources/QUICKSTART.md"> quickstart guide </a>
    and
    <a href="https://www.github.com/MaruMaruOO/eve-fleet-simulator/blob/master/resources/Limitations.md"> List of known limitations</a>.<br />
    If your question is still unanswered consider
    <a href="https://www.github.com/MaruMaruOO/eve-fleet-simulator/issues"> opening a github issue </a>
    if it&apos;s a bug or contacting the developer so it can be added to the FAQ or documentation.`
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
          <a href="https://www.github.com/MaruMaruOO/eve-fleet-simulator"> projects github page</a>.
          The developers can also be reached by sending emails to evefleetsim@gmail.com.
        </Segment>
        <Header as="h5" attached="top">
          License
        </Header>
        <Segment attached>
          Eve Fleet Simulator is released under the
          <a href="https://www.github.com/MaruMaruOO/eve-fleet-simulator/blob/master/LICENSE" type="license"> GNU Affero GPL license </a>
          and it&apos;s
          <a href="https://www.github.com/MaruMaruOO/eve-fleet-simulator"> source is available here</a>.
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
