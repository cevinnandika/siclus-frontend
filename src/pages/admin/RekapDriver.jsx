import React, { useState, useEffect, useMemo } from "react";
import { apiService } from "../../services/api";
import { exportAllDriversToExcel, exportDriverSessionsToExcel } from "../../utils/exportExcel";
import { groupRekapData, generateSessionRows } from "./rekap-driver/utils/rekapDataHelpers";
import RekapTable from "./rekap-driver/components/RekapTable";
import DetailRekapView from "./rekap-driver/components/DetailRekapView";
import ImageLightboxModal from "./rekap-driver/components/ImageLightboxModal";

const RekapAdmin = () => {
  const [rawData, setRawData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch Rekap Data
  useEffect(() => {
    const fetchRekap = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.getRekapAdmin();
        if (response) {
          const list = response.data || (Array.isArray(response) ? response : []);
          setRawData(list);
        }
      } catch (error) {
        console.error("Gagal menarik data rekap:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRekap();
  }, []);

  // Filter & Grouping Data
  const groupedData = useMemo(() => {
    return groupRekapData(rawData, startDate, endDate, searchQuery);
  }, [rawData, startDate, endDate, searchQuery]);

  // Selected Driver for Detail View
  const selectedDriver = useMemo(() => {
    if (!selectedDriverId) return null;
    return groupedData.find((d) => d.id_supir === selectedDriverId) || null;
  }, [groupedData, selectedDriverId]);

  // Handlers Date Filter
  const handleApplyDateFilter = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleClearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  // Handlers Export Excel
  const handleExportAll = () => {
    exportAllDriversToExcel(groupedData, generateSessionRows, startDate, endDate);
  };

  const handleExportPerDriver = () => {
    if (!selectedDriver) return;
    exportDriverSessionsToExcel(selectedDriver, generateSessionRows, startDate, endDate);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8 animate-[fadeIn_0.3s] text-left">
      {!selectedDriver ? (
        <RekapTable
          groupedData={groupedData}
          isLoading={isLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          startDate={startDate}
          endDate={endDate}
          onApplyDateFilter={handleApplyDateFilter}
          onClearDateFilter={handleClearDateFilter}
          onExportAll={handleExportAll}
          onSelectDriver={(driverId) => setSelectedDriverId(driverId)}
        />
      ) : (
        <DetailRekapView
          selectedDriver={selectedDriver}
          startDate={startDate}
          endDate={endDate}
          onBack={() => setSelectedDriverId(null)}
          onApplyDateFilter={handleApplyDateFilter}
          onClearDateFilter={handleClearDateFilter}
          onExportExcel={handleExportPerDriver}
          onImageClick={(imgUrl) => setSelectedImage(imgUrl)}
          generateSessionRows={generateSessionRows}
        />
      )}

      {/* Image Zoom Modal Lightbox */}
      <ImageLightboxModal
        selectedImage={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
};

export default RekapAdmin;
