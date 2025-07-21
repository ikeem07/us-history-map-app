import React, { useState } from 'react';
import { Drawer, Select, Button, Typography, Tag, Space } from 'antd';
import { CheckOutlined, FilterOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

export type FilterSidebarProps = {
  selectedTags: string[];
  selectedPeople: string[];
  allTags: string[];
  allPeople: string[];
  onChangeTags: (tags: string[]) => void;
  onChangePeople: (people: string[]) => void;
  onClear: () => void;
};

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  selectedTags,
  selectedPeople,
  allTags,
  allPeople,
  onChangeTags,
  onChangePeople,
  onClear
}) => {
  const [visible, setVisible] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChangeTags(selectedTags.filter(t => t !== tag));
    } else {
      onChangeTags([...selectedTags, tag]);
    }
  };

  const toggleDrawer = () => setVisible(prev => !prev);

  return (
    <>
      {!visible && (
        <Button
          type="primary"
          icon={<FilterOutlined />}
          style={{ position: 'absolute', top: 20, left: 20, zIndex: 1100 }}
          onClick={toggleDrawer}
        >
          Filters
        </Button>
      )}

      <Drawer
        title="Filter Events"
        placement="left"
        onClose={toggleDrawer}
        open={visible}
        width={280}
        mask={false}
        style={{ position: 'absolute', zIndex: 1050 }}
      >
        <Title level={5}>Tags</Title>
        <Space wrap style={{ marginBottom: 16 }}>
          {allTags.map(tag => (
            <Tag
              key={tag}
              color={selectedTags.includes(tag) ? 'blue' : 'default'}
              onClick={() => toggleTag(tag)}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              {tag} {selectedTags.includes(tag) && <CheckOutlined />}
            </Tag>
          ))}
        </Space>

        <Title level={5}>People</Title>
        <Select
          mode="multiple"
          allowClear
          placeholder="Select people"
          style={{ width: '100%', marginBottom: 16 }}
          value={selectedPeople}
          onChange={(people) => onChangePeople(people)}
        >
          {allPeople.map((person) => (
            <Option key={person} value={person}>
              {person}
            </Option>
          ))}
        </Select>

        <Button block onClick={onClear}>Clear Filters</Button>
      </Drawer>
    </>
  );
};

export default FilterSidebar;
