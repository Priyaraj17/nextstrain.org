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
import { fetchAndParseJSON } from "../util/datasetsHelpers";

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

const GroupNotFound = (groupName) => (
  <FlexCenter>
    <splashStyles.CenteredFocusParagraph>
      {`The Nextstrain Group "${groupName}" doesn't exist yet. `}
      Please <a href="mailto:hello@nextstrain.org">contact us at hello@nextstrain.org </a>
      if you believe this to be an error.</splashStyles.CenteredFocusParagraph>
  </FlexCenter>
);

const OverviewContainer = styled.div`
  text-align: justify;
  font-size: 16px;
  margin-top: 5px;
  margin-bottom: 5px;
  font-weight: 300;
  color: var(--darkGrey);
  line-height: 1.42857143;
  margin: 0px auto 0px auto;
  max-width: 900px;
`;

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

  // parse getAvailable listing into one that dataset-select component accepts
  createDatasetListing = (list, groupName) => {
    return list.map((d) => {
      return {
        filename: d.request.replace(`groups/${groupName}/`, '').replace('narratives/', ''),
        url: `https://nextstrain.org/${d.request}`,
        contributor: groupName
      };
    });
  };

  async componentDidMount() {
    const groupName = this.props["groupName"];
    let sourceInfoPromise, availableDataPromise;
    try {
      [sourceInfoPromise, availableDataPromise] = await Promise.allSettled([
        fetchAndParseJSON(`/charon/getSourceInfo?prefix=/groups/${groupName}/`),
        fetchAndParseJSON(`/charon/getAvailable?prefix=/groups/${groupName}/`)
      ]);
      this.setState({
        sourceInfo: sourceInfoPromise.value,
        groupName,
        datasets: this.createDatasetListing(availableDataPromise.value.datasets, groupName),
        narratives: this.createDatasetListing(availableDataPromise.value.narratives, groupName),
        dataLoaded: true
      });
    } catch (err) {
      if (sourceInfoPromise.status === "rejected") {
        console.error("Cannot find group.", err.message);
        this.setState({groupName, groupNotFound: true});
      } else {
        console.error("Error fetching / parsing data.", err.message);
        this.setState({
          groupName,
          sourceInfo: sourceInfoPromise.value,
          errorFetchingData: true
        });
      }
    }
  }

  render() {
    if (this.state.groupNotFound) {
      return (
        <GenericPage location={this.props.location}>
          <GroupNotFound groupName={this.state.groupName}/>
        </GenericPage>
      );
    }
    return (
      <GenericPage location={this.props.location}>
        {this.state.sourceInfo &&
        <>
          <FlexCenter>
            <Title avatarSrc={this.state.sourceInfo.avatar}>
              {this.state.sourceInfo.title}
              <Byline>{this.state.sourceInfo.byline}</Byline>
              <Website>{this.state.sourceInfo.website}</Website>
            </Title>
          </FlexCenter>
          {this.state.sourceInfo.overview &&
            <FlexCenter>
              <OverviewContainer>
                {this.state.sourceInfo.overview}
              </OverviewContainer>
            </FlexCenter>
          }
        </>}
        <HugeSpacer />
        {this.state.dataLoaded && this.state.sourceInfo && this.state.sourceInfo.showDatasets && (
          <ScrollableAnchor id={"datasets"}>
            <div>
              <splashStyles.H3>Available datasets</splashStyles.H3>
              {this.state.datasets.length === 0 ?
                <splashStyles.H4>No datasets are available for this group.</splashStyles.H4>
                : <DatasetSelect
                  datasets={this.state.datasets}
                  columns={[
                    {
                      name: "Dataset",
                      value: (dataset) => dataset.filename.replace(/_/g, ' / ').replace('.json', ''),
                      url: (dataset) => dataset.url
                    }
                  ]}
                />
              }
            </div>
          </ScrollableAnchor>
        )}
        <HugeSpacer />
        {this.state.dataLoaded && this.state.sourceInfo && this.state.sourceInfo.showNarratives && (
          <ScrollableAnchor id={"narratives"}>
            <div>
              <splashStyles.H3>Available narratives</splashStyles.H3>
              {this.state.narratives.length === 0 ?
                <splashStyles.H4>No narratives are available for this group.</splashStyles.H4>
                : <DatasetSelect
                  datasets={this.state.narratives}
                  columns={[
                    {
                      name: "Narrative",
                      value: (dataset) => dataset.filename.replace(/_/g, ' / ').replace('.json', ''),
                      url: (dataset) => dataset.url
                    }
                  ]}
                  title="Filter Narratives"
                />
              }
            </div>
          </ScrollableAnchor>
        )}
        { this.state.errorFetchingData &&
          <FlexCenter>
            <splashStyles.CenteredFocusParagraph>
                  Something went wrong getting data.
                  Please <a href="mailto:hello@nextstrain.org">contact us at hello@nextstrain.org </a>
                  if this continues to happen.</splashStyles.CenteredFocusParagraph>
          </FlexCenter>}
      </GenericPage>
    );
  }
}

export default Index;
