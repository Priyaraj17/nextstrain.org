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
    fetchAndParseJSON(`/charon/getSourceInfo?prefix=/groups/${groupName}/`)
      .then((sourceInfo) => {
        this.setState({sourceInfo});
        return sourceInfo;
      })
      .catch((err) => {
        console.error("Cannot find group.", err.message);
        this.setState({groupName, groupNotFound: true});
      })
      .then((sourceInfo) => {
        if (sourceInfo && (sourceInfo.showDatasets || sourceInfo.showNarratives)) {
          return fetchAndParseJSON(`/charon/getAvailable?prefix=/groups/${groupName}/`);
        }
        return undefined;
      })
      .then((availableDataJson) => {
        if (availableDataJson) {
          this.setState({
            datasets: this.createDatasetListing(availableDataJson.datasets, groupName),
            narratives: this.createDatasetListing(availableDataJson.narratives, groupName),
            dataLoaded: true,
            groupName
          });
        }
      })
      .catch((err) => {
        console.error("Error fetching / parsing data.", err.message);
        this.setState({errorFetchingData: true});
      });
  }

  render() {
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
        {this.state.dataLoaded && this.state.sourceInfo && this.state.sourceInfo.showDatasets && this.state.datasets.length > 0 && (
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
        {this.state.dataLoaded && this.state.sourceInfo && this.state.sourceInfo.showNarratives && this.state.narratives.length > 0 &&(
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
        { this.state.errorFetchingData &&
          <FlexCenter>
            <splashStyles.CenteredFocusParagraph>
                  Something went wrong getting data.
                  Please <a href="mailto:hello@nextstrain.org">contact us at hello@nextstrain.org </a>
                  if this continues to happen.</splashStyles.CenteredFocusParagraph>
          </FlexCenter>}
        { this.state.groupNotFound &&
        <FlexCenter>
          <splashStyles.CenteredFocusParagraph>
            {`The Nextstrain Group "${this.state.groupName}" doesn't exist yet. `}
            Please <a href="mailto:hello@nextstrain.org">contact us at hello@nextstrain.org </a>
            if you believe this to be an error.</splashStyles.CenteredFocusParagraph>
        </FlexCenter>}
      </GenericPage>
    );
  }
}

export default Index;
