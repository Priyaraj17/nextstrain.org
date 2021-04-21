import React from "react";
import ScrollableAnchor, { configureAnchors } from "react-scrollable-anchor";
import styled from 'styled-components';
import {
  HugeSpacer,
  FlexCenter
} from "../layouts/generalComponents";
import * as splashStyles from "../components/splash/styles";
import DatasetSelect from "../components/Datasets/dataset-select";
import GenericPage from "../layouts/generic-page";

// TODO: these functions are copied from auspice-client/customizations/splash.js
// We should abstract them into a util function JS file if we actually want to use
// them in both places going forward, otherwise we can go another direction with the
// interface here.
function Title({avatarSrc, children}) {
  if (!children) return null;
  const AvatarImg = styled.img`
    width: 140px;
    margin-right: 20px;
    object-fit: contain;
  `;
  const TitleDiv = styled.div`
    && {
      font-weight: 500;
      font-size: 26px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
  `;
  return (
    <div style={{display: "flex", justifyContent: "start", padding: "50px 0px 20px 0px"}}>
      {avatarSrc ?
        <AvatarImg alt="avatar" src={avatarSrc}/> :
        null
      }
      <TitleDiv>
        {children}
      </TitleDiv>
    </div>
  );
}

function Byline({children}) {
  if (!children) return null;
  const Div = styled.div`
    && {
      font-size: 18px;
      font-weight: 400;
      line-height: 1.428;
      color: #A9ADB1;
    }
  `;
  return (<Div>{children}</Div>);
}

function Website({children}) {
  if (!children) return null;
  return (
    <a href={children}
      style={{color: "#A9ADB1", lineHeight: "1.0", textDecoration: "none", cursor: "pointer", fontWeight: "400", fontSize: "16px"}}
    >
      {children}
    </a>
  );
}

class Index extends React.Component {
  constructor(props) {
    super(props);
    configureAnchors({ offset: -10 });
    this.state = {
      dataLoaded: false,
      errorFetchingData: false,
      groupNotFound: false,
      groupName: undefined,
      sourceInfo: undefined
    };
  }
  async componentDidMount() {
    const groupName = this.props["*"];
    const getSourceInfoUrl = `/charon/getSourceInfo?prefix=/groups/${groupName}/`;
    let sourceInfo;
    // TODO promise logic and error catching improvements here
    try {
      sourceInfo = await fetch(getSourceInfoUrl)
        .then((res) => res.text())
        .then((text) => JSON.parse(text));
      this.setState({sourceInfo});
    } catch (err) {
      console.error("Cannot find group.", err.message);
      this.setState({groupNotFound: true});
    }
    if (sourceInfo && (sourceInfo.showDatasets || sourceInfo.showNarratives)) {
      const getAvailableUrl = `/charon/getAvailable?prefix=/groups/${groupName}/`;
      try {
        const {datasets, narratives} = await fetchAndParseJSON(getAvailableUrl, groupName);
        this.setState({datasets, narratives, dataLoaded: true, groupName});
      } catch (err) {
        console.error("Error fetching / parsing data.", err.message);
        this.setState({errorFetchingData: true});
      }
    }
  }

  render() {
    return (
      <GenericPage location={this.props.location}>
        {this.state.sourceInfo && this.state.dataLoaded &&
        <>
          <FlexCenter>
            <Title avatarSrc={this.state.sourceInfo.avatar}>
              {this.state.sourceInfo.title}
              <Byline>{this.state.sourceInfo.byline}</Byline>
              <Website>{this.state.sourceInfo.website}</Website>
            </Title>
          </FlexCenter>
          {/* TODO display this.state.sourceInfo.overview (markdown) */}
          <HugeSpacer />
          {this.state.sourceInfo.showDatasets && (
            <ScrollableAnchor id={"datasets"}>
              <div>
                <splashStyles.H3>Available datasets</splashStyles.H3>
                <DatasetSelect
                  datasets={this.state.datasets}
                  columns={[
                    {
                      name: "Dataset",
                      value: (dataset) => dataset.filename.replace(/_/g, ' / ').replace('.json', ''),
                      url: (dataset) => dataset.url
                    }
                  ]}
                />
              </div>
            </ScrollableAnchor>
          )}
          <HugeSpacer />
          {this.state.sourceInfo.showNarratives && (
            <ScrollableAnchor id={"narratives"}>
              <div>
                <splashStyles.H3>Available narratives</splashStyles.H3>
                <DatasetSelect
                  datasets={this.state.narratives}
                  columns={[
                    {
                      name: "Narrative",
                      value: (dataset) => dataset.filename.replace(/_/g, ' / ').replace('.json', ''),
                      url: (dataset) => dataset.url
                    }
                  ]}
                  unit="narrative"
                />
              </div>
            </ScrollableAnchor>
          )}
          { this.state.errorFetchingData && <splashStyles.CenteredFocusParagraph>
                        Something went wrong getting data.
                        Please <a href="mailto:hello@nextstrain.org">contact us at hello@nextstrain.org </a>
                        if this continues to happen.</splashStyles.CenteredFocusParagraph>}
        </>}
      </GenericPage>
    );
  }
}

const createDatasetListing = (list, groupName) => {
  return list.map((d) => {
    return {
      filename: d.request,
      url: `https://nextstrain.org/${d.request}`,
      contributor: groupName
    };
  });
};

async function fetchAndParseJSON(jsonUrl, groupName) {
  const datasetsJSON = await fetch(jsonUrl)
    .then((res) => res.text())
    .then((text) => {
      const data = JSON.parse(text);
      return {
        datasets: createDatasetListing(data.datasets, groupName),
        narratives: createDatasetListing(data.narratives, groupName)
      };
    })
    .catch((err) => {
      console.err(err);
    });
  return datasetsJSON;
}

export default Index;
